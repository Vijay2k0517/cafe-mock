from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from enum import Enum
import jwt
import uuid
import asyncio
from contextlib import asynccontextmanager
import random
import re
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Lock Configuration
LOCK_TTL_MINUTES = 5  # Lock timeout duration for optimistic locks
PESSIMISTIC_LOCK_TIMEOUT = 5.0  # Timeout for acquiring pessimistic locks (seconds)

# OTP Configuration
OTP_EXPIRY_MINUTES = 5
OTP_LENGTH = 6

# SMS Configuration (Twilio or other providers)
SMS_ENABLED = os.environ.get('SMS_ENABLED', 'false').lower() == 'true'
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')


# ============================================================================
# SMS SERVICE
# ============================================================================

class SMSService:
    """Service for sending SMS messages using Twilio"""
    
    @staticmethod
    async def send_sms(phone: str, message: str) -> dict:
        """
        Send an SMS message
        
        Args:
            phone: Phone number to send to (with country code)
            message: Message content
            
        Returns:
            dict with status and message_id or error
        """
        if not SMS_ENABLED:
            # Log the message in development mode
            logging.info(f"SMS (DEV MODE) to {phone}: {message}")
            return {"status": "success", "mode": "development", "message": message}
        
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
            logging.warning("Twilio credentials not configured")
            return {"status": "error", "error": "SMS service not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
                    auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                    data={
                        "From": TWILIO_PHONE_NUMBER,
                        "To": phone,
                        "Body": message
                    }
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    return {"status": "success", "message_sid": result.get("sid")}
                else:
                    logging.error(f"SMS send failed: {response.text}")
                    return {"status": "error", "error": response.text}
        except Exception as e:
            logging.error(f"SMS send exception: {e}")
            return {"status": "error", "error": str(e)}
    
    @staticmethod
    async def send_otp(phone: str, otp: str) -> dict:
        """Send OTP via SMS"""
        message = f"Your Isai Café verification code is: {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes. Do not share this code."
        return await SMSService.send_sms(phone, message)
    
    @staticmethod
    async def send_booking_confirmation(phone: str, booking_details: dict) -> dict:
        """Send booking confirmation via SMS"""
        message = f"""🎉 Booking Confirmed at Isai Café!

📅 Date: {booking_details.get('date')}
🕐 Time: {booking_details.get('time')}
👥 Guests: {booking_details.get('guests')}
🪑 Table: #{booking_details.get('table_number')}

Reservation ID: {booking_details.get('reservation_id', 'N/A')[:8]}

See you soon! ☕"""
        return await SMSService.send_sms(phone, message)
    
    @staticmethod
    async def send_booking_cancellation(phone: str, booking_details: dict) -> dict:
        """Send booking cancellation notice via SMS"""
        message = f"""Your reservation at Isai Café has been cancelled.

📅 Date: {booking_details.get('date')}
🕐 Time: {booking_details.get('time')}

If this was a mistake, please make a new reservation.

Isai Café ☕"""
        return await SMSService.send_sms(phone, message)


sms_service = SMSService()

# ============================================================================
# PESSIMISTIC LOCK MANAGER
# ============================================================================

class PessimisticLockManager:
    """Manages pessimistic locks for database resources to prevent race conditions"""
    
    def __init__(self):
        self._resource_locks = {}  # resource_id -> asyncio.Lock
        self._global_lock = asyncio.Lock()  # Protects access to resource_locks
        
    async def acquire(self, resource_id: str, timeout: float = PESSIMISTIC_LOCK_TIMEOUT) -> bool:
        """
        Acquire a pessimistic lock for a specific resource
        
        Args:
            resource_id: Unique identifier for the resource (e.g., "table:123", "reservation:456")
            timeout: Maximum time to wait for the lock (seconds)
            
        Returns:
            bool: True if lock acquired, False if timeout
        """
        # Get or create the lock for this resource
        async with self._global_lock:
            if resource_id not in self._resource_locks:
                self._resource_locks[resource_id] = asyncio.Lock()
            lock = self._resource_locks[resource_id]
        
        # Try to acquire the lock with timeout
        try:
            await asyncio.wait_for(lock.acquire(), timeout=timeout)
            logging.debug(f"Acquired lock for {resource_id}")
            return True
        except asyncio.TimeoutError:
            logging.warning(f"Timeout acquiring lock for {resource_id}")
            return False
    
    async def release(self, resource_id: str):
        """
        Release a pessimistic lock for a specific resource
        """
        async with self._global_lock:
            if resource_id in self._resource_locks:
                lock = self._resource_locks[resource_id]
                if lock.locked():
                    lock.release()
                    logging.debug(f"Released lock for {resource_id}")
                
                # Clean up if lock is no longer in use
                if not lock.locked():
                    del self._resource_locks[resource_id]
    
    @asynccontextmanager
    async def lock_resource(self, resource_id: str, timeout: float = PESSIMISTIC_LOCK_TIMEOUT):
        """
        Context manager for acquiring/releasing pessimistic locks
        
        Usage:
            async with lock_manager.lock_resource("table:123"):
                # Critical section - safe to modify table 123
        """
        acquired = await self.acquire(resource_id, timeout)
        if not acquired:
            raise HTTPException(
                status_code=503,
                detail="Resource is currently being modified. Please try again."
            )
        try:
            yield
        finally:
            await self.release(resource_id)

# Global pessimistic lock manager instance
lock_manager = PessimisticLockManager()

# Background task for cleaning up expired optimistic locks
lock_cleanup_task = None


class TableStatus(str, Enum):
    AVAILABLE = "available"
    LOCKED = "locked"
    BOOKED = "booked"


class ReservationStatus(str, Enum):
    LOCKED = "locked"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


async def cleanup_expired_locks():
    """Background task to automatically release expired optimistic locks"""
    while True:
        try:
            now = datetime.now(timezone.utc)
            
            # Find and update expired optimistic locks
            expired_result = await db.reservations.update_many(
                {
                    "status": ReservationStatus.LOCKED.value,
                    "lock_expiry_time": {"$lt": now.isoformat()}
                },
                {
                    "$set": {"status": ReservationStatus.EXPIRED.value}
                }
            )
            
            if expired_result.modified_count > 0:
                logging.info(f"Released {expired_result.modified_count} expired optimistic locks")
            
            await asyncio.sleep(60)  # Run every 60 seconds
        except asyncio.CancelledError:
            break
        except Exception as e:
            logging.error(f"Error in lock cleanup task: {e}")
            await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown events"""
    global lock_cleanup_task
    
    # Create indexes for better performance and concurrency control
    await db.reservations.create_index([("table_id", 1), ("date", 1), ("time", 1)])
    await db.reservations.create_index([("status", 1), ("lock_expiry_time", 1)])
    await db.reservations.create_index([("user_email", 1)])
    await db.tables.create_index([("capacity", 1)])
    
    # Start background optimistic lock cleanup task
    lock_cleanup_task = asyncio.create_task(cleanup_expired_locks())
    logging.info("Started background lock cleanup task")
    
    yield
    
    # Shutdown: cancel background task and close DB connection
    if lock_cleanup_task:
        lock_cleanup_task.cancel()
        try:
            await lock_cleanup_task
        except asyncio.CancelledError:
            pass
    client.close()
    logging.info("Shutdown complete")


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ.get("SECRET_KEY", "lumiere-cafe-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


class UserRole(str, Enum):
    CUSTOMER = "customer"
    AGENT = "agent"
    ADMIN = "admin"


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    phone: str
    name: str
    email: Optional[EmailStr] = None
    role: str = UserRole.CUSTOMER.value
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    phone: str
    name: str
    email: Optional[EmailStr] = None
    role: str = UserRole.CUSTOMER.value
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        # Remove spaces, dashes, and other common separators
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        # Ensure it starts with + for country code or is a valid number
        if not re.match(r'^\+?[1-9]\d{6,14}$', cleaned):
            raise ValueError('Invalid phone number format. Use format like +1234567890')
        return cleaned


class UserInDB(User):
    hashed_password: Optional[str] = None


class OTPRequest(BaseModel):
    phone: str
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?[1-9]\d{6,14}$', cleaned):
            raise ValueError('Invalid phone number format. Use format like +1234567890')
        return cleaned


class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    role: str = UserRole.CUSTOMER.value
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?[1-9]\d{6,14}$', cleaned):
            raise ValueError('Invalid phone number format')
        return cleaned
    
    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('OTP must be exactly 6 digits')
        return v


class OTPRecord(BaseModel):
    phone: str
    otp: str
    created_at: datetime
    expires_at: datetime
    verified: bool = False
    attempts: int = 0


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User
    is_new_user: bool = False


class LegacyUserCreate(BaseModel):
    """Legacy email-based registration (kept for backwards compatibility)"""
    email: EmailStr
    name: str
    password: str
    role: str = "customer"


class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    description: str
    category: str
    price: float
    image: Optional[str] = None
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MenuItemCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    image: Optional[str] = None
    available: bool = True


class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    number: int
    capacity: int
    location: str
    available: bool = True
    status: str = TableStatus.AVAILABLE.value


class TableCreate(BaseModel):
    number: int
    capacity: int
    location: str
    available: bool = True


class Reservation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_phone: str
    user_name: str
    user_email: Optional[str] = None  # Legacy support
    phone: Optional[str] = None  # Display phone
    date: str
    time: str
    duration_minutes: int = 90  # Default reservation duration
    guests: int
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    status: str = ReservationStatus.LOCKED.value
    lock_expiry_time: Optional[str] = None
    special_requests: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    sms_sent: bool = False
    booked_by_role: str = UserRole.CUSTOMER.value  # Track who made the booking


class ReservationCreate(BaseModel):
    date: str
    time: str
    guests: int
    phone: Optional[str] = None
    table_id: Optional[str] = None
    special_requests: Optional[str] = None
    duration_minutes: int = 90


# New models for seat-locking reservation system
class AvailableTablesRequest(BaseModel):
    date: str
    time: str
    guests: int
    duration_minutes: int = 90


class LockTableRequest(BaseModel):
    date: str
    time: str
    guests: int
    table_id: str
    phone: Optional[str] = None
    special_requests: Optional[str] = None
    duration_minutes: int = 90


class ConfirmReservationRequest(BaseModel):
    reservation_id: str


class TableAvailability(BaseModel):
    table: Table
    is_available: bool
    reason: Optional[str] = None


class CafeInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "main"
    name: str = "Lumière Café"
    description: str
    address: str
    phone: str
    email: EmailStr
    hours: dict
    social_media: dict


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(OTP_LENGTH)])


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    # Try to find user by phone first, then by email (legacy support)
    user = await db.users.find_one({"phone": phone}, {"_id": 0, "hashed_password": 0})
    if not user:
        # Legacy email-based lookup
        user = await db.users.find_one({"email": phone}, {"_id": 0, "hashed_password": 0})
    
    if user is None:
        raise credentials_exception
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    # Handle legacy users that don't have phone
    if 'phone' not in user and 'email' in user:
        user['phone'] = user['email']
    
    return User(**user)


async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[User]:
    """Get current user if authenticated, None otherwise"""
    if not token:
        return None
    try:
        return await get_current_user(token)
    except HTTPException:
        return None


async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def get_current_agent(current_user: User = Depends(get_current_user)):
    """Get current agent - allows both agents and admins"""
    if current_user.role not in [UserRole.AGENT.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Agent access required")
    return current_user


# ============================================================================
# PHONE/OTP AUTHENTICATION ENDPOINTS
# ============================================================================

@api_router.post("/auth/send-otp")
async def send_otp(otp_request: OTPRequest):
    """
    Send OTP to phone number for authentication.
    If user doesn't exist, they can create account after OTP verification.
    """
    phone = otp_request.phone
    
    # Check for recent OTP requests (rate limiting)
    recent_otp = await db.otps.find_one({
        "phone": phone,
        "created_at": {"$gt": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()}
    })
    
    if recent_otp:
        raise HTTPException(
            status_code=429,
            detail="Please wait 1 minute before requesting another OTP"
        )
    
    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    
    # Store OTP
    await db.otps.delete_many({"phone": phone})  # Remove old OTPs
    await db.otps.insert_one({
        "phone": phone,
        "otp": otp,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
        "verified": False,
        "attempts": 0
    })
    
    # Send OTP via SMS
    sms_result = await sms_service.send_otp(phone, otp)
    
    # Check if user exists
    existing_user = await db.users.find_one({"phone": phone})
    
    return {
        "message": "OTP sent successfully",
        "phone": phone,
        "expires_in_minutes": OTP_EXPIRY_MINUTES,
        "is_existing_user": existing_user is not None,
        "sms_status": sms_result.get("status"),
        # Include OTP in response only in dev mode for testing
        "otp_debug": otp if not SMS_ENABLED else None
    }


@api_router.post("/auth/verify-otp", response_model=Token)
async def verify_otp(otp_data: OTPVerify):
    """
    Verify OTP and authenticate user.
    Creates new user if they don't exist (requires name and role).
    """
    phone = otp_data.phone
    
    # Find OTP record
    otp_record = await db.otps.find_one({
        "phone": phone,
        "verified": False
    })
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    
    # Check expiry
    expires_at = datetime.fromisoformat(otp_record['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        await db.otps.delete_one({"_id": otp_record['_id']})
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Check attempts (max 3)
    if otp_record['attempts'] >= 3:
        await db.otps.delete_one({"_id": otp_record['_id']})
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please request a new OTP.")
    
    # Verify OTP
    if otp_record['otp'] != otp_data.otp:
        await db.otps.update_one(
            {"_id": otp_record['_id']},
            {"$inc": {"attempts": 1}}
        )
        remaining = 3 - otp_record['attempts'] - 1
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining} attempts remaining."
        )
    
    # Mark OTP as verified
    await db.otps.update_one(
        {"_id": otp_record['_id']},
        {"$set": {"verified": True}}
    )
    
    # Find or create user
    user = await db.users.find_one({"phone": phone})
    is_new_user = False
    
    if not user:
        # New user - require name
        if not otp_data.name:
            raise HTTPException(
                status_code=400,
                detail="Name is required for new users"
            )
        
        # Validate role
        if otp_data.role not in [UserRole.CUSTOMER.value, UserRole.AGENT.value]:
            otp_data.role = UserRole.CUSTOMER.value
        
        # Create new user
        user_dict = {
            "phone": phone,
            "name": otp_data.name,
            "role": otp_data.role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_dict)
        is_new_user = True
        user = user_dict
    
    # Create token with phone as subject
    access_token = create_access_token(data={"sub": phone})
    
    # Parse created_at
    created_at = user.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    user_obj = User(
        phone=user['phone'],
        name=user['name'],
        email=user.get('email'),
        role=user.get('role', UserRole.CUSTOMER.value),
        created_at=created_at or datetime.now(timezone.utc)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_obj,
        is_new_user=is_new_user
    )


@api_router.post("/auth/register", response_model=Token)
async def register(user_data: LegacyUserCreate):
    """Legacy email-based registration (kept for backwards compatibility)"""
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict['hashed_password'] = hashed_password
    user_dict['phone'] = user_data.email  # Use email as phone for legacy users
    user_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    del user_dict['password']
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user_data.email})
    user = User(phone=user_data.email, name=user_data.name, email=user_data.email, role=user_data.role, created_at=datetime.now(timezone.utc))
    
    return Token(access_token=access_token, token_type="bearer", user=user)


@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Legacy email-based login (kept for backwards compatibility)"""
    user = await db.users.find_one({"email": form_data.username})
    if not user:
        # Try phone-based lookup
        user = await db.users.find_one({"phone": form_data.username})
    
    if not user or (user.get('hashed_password') and not verify_password(form_data.password, user['hashed_password'])):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    # Use phone as subject if available, otherwise email
    subject = user.get('phone', user.get('email'))
    access_token = create_access_token(data={"sub": subject})
    
    user_obj = User(
        phone=user.get('phone', user.get('email')),
        name=user['name'],
        email=user.get('email'),
        role=user.get('role', 'customer'),
        created_at=datetime.fromisoformat(user['created_at']) if isinstance(user.get('created_at'), str) else user.get('created_at', datetime.now(timezone.utc))
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================================================
# SEAT-LOCKING RESERVATION SYSTEM WITH PESSIMISTIC LOCKING
# ============================================================================

def parse_time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes from midnight"""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def check_time_overlap(
    start1: str, duration1: int,
    start2: str, duration2: int
) -> bool:
    """Check if two time slots overlap"""
    start1_mins = parse_time_to_minutes(start1)
    end1_mins = start1_mins + duration1
    start2_mins = parse_time_to_minutes(start2)
    end2_mins = start2_mins + duration2
    
    return not (end1_mins <= start2_mins or end2_mins <= start1_mins)


async def get_conflicting_reservations_with_pessimistic_lock(
    table_id: str,
    date: str,
    time: str,
    duration_minutes: int,
    exclude_reservation_id: Optional[str] = None
) -> List[dict]:
    """
    Find all reservations that would conflict with the requested time slot.
    Uses pessimistic locking on the table to prevent race conditions.
    """
    # Acquire pessimistic lock for this table
    async with lock_manager.lock_resource(f"table_conflicts:{table_id}"):
        # Build query for active reservations on the same table and date
        query = {
            "table_id": table_id,
            "date": date,
            "status": {"$in": [ReservationStatus.LOCKED.value, ReservationStatus.CONFIRMED.value]}
        }
        
        if exclude_reservation_id:
            query["id"] = {"$ne": exclude_reservation_id}
        
        reservations = await db.reservations.find(query, {"_id": 0}).to_list(100)
        
        # Filter for actual time overlaps
        conflicts = []
        for res in reservations:
            res_duration = res.get("duration_minutes", 90)
            if check_time_overlap(time, duration_minutes, res["time"], res_duration):
                # For locked reservations, also check if the lock is still valid
                if res["status"] == ReservationStatus.LOCKED.value:
                    lock_expiry = res.get("lock_expiry_time")
                    if lock_expiry:
                        expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
                        if expiry_time <= datetime.now(timezone.utc):
                            # Lock has expired, mark it as expired
                            await db.reservations.update_one(
                                {"id": res["id"]},
                                {"$set": {"status": ReservationStatus.EXPIRED.value}}
                            )
                            continue
                conflicts.append(res)
        
        return conflicts


async def find_suitable_tables_with_pessimistic_lock(guests: int, date: str, time: str, duration_minutes: int) -> List[dict]:
    """
    Find available tables that can accommodate the given number of guests.
    Uses table-level pessimistic locking to prevent race conditions.
    Returns tables sorted by capacity (smallest suitable first - optimal allocation).
    """
    # Get all tables that can accommodate the guests
    tables = await db.tables.find(
        {
            "capacity": {"$gte": guests},
            "available": True
        },
        {"_id": 0}
    ).sort("capacity", 1).to_list(100)
    
    available_tables = []
    
    for table in tables:
        # Check each table with a pessimistic lock
        async with lock_manager.lock_resource(f"table_check:{table['id']}"):
            conflicts = await get_conflicting_reservations_with_pessimistic_lock(
                table["id"], date, time, duration_minutes
            )
            if not conflicts:
                available_tables.append(table)
    
    return available_tables


@api_router.post("/reservations/available-tables", response_model=List[Table])
async def get_available_tables(request: AvailableTablesRequest):
    """
    Check available tables by date, time, and number of guests.
    Uses pessimistic locking to ensure accurate results during concurrent access.
    Returns tables sorted by capacity (smallest suitable first).
    """
    available = await find_suitable_tables_with_pessimistic_lock(
        request.guests,
        request.date,
        request.time,
        request.duration_minutes
    )
    
    return [Table(**t) for t in available]


@api_router.post("/reservations/lock", response_model=Reservation)
async def lock_table_with_pessimistic_lock(request: LockTableRequest, current_user: User = Depends(get_current_user)):
    """
    Lock a table for a user with a TTL of 5 minutes.
    Uses PESSIMISTIC LOCKING to prevent race conditions.
    
    The algorithm:
    1. Acquire pessimistic lock on the table
    2. Check if the table exists and has sufficient capacity
    3. Check for conflicting reservations (LOCKED or CONFIRMED)
    4. Use atomic database operations to create the lock
    5. If another user locked it first, reject the request
    """
    # Step 1: Acquire pessimistic lock for this table
    async with lock_manager.lock_resource(f"table_lock:{request.table_id}"):
        # Step 2: Validate table exists and has capacity
        table = await db.tables.find_one({"id": request.table_id}, {"_id": 0})
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        if table["capacity"] < request.guests:
            raise HTTPException(
                status_code=400,
                detail=f"Table capacity ({table['capacity']}) is less than requested guests ({request.guests})"
            )
        
        if not table.get("available", True):
            raise HTTPException(status_code=400, detail="Table is not available for reservations")
        
        # Step 3: Check for conflicting reservations with pessimistic lock
        conflicts = await get_conflicting_reservations_with_pessimistic_lock(
            request.table_id,
            request.date,
            request.time,
            request.duration_minutes
        )
        
        if conflicts:
            conflict = conflicts[0]
            if conflict["status"] == ReservationStatus.LOCKED.value:
                raise HTTPException(
                    status_code=409,  # Conflict
                    detail="Table is currently locked by another user. Please try again later or choose another table."
                )
            else:
                raise HTTPException(
                    status_code=409,
                    detail="Table is already booked for this time slot. Please choose another time or table."
                )
        
        # Step 4: Check for idempotency - prevent duplicate locks by same user
        existing_lock = await db.reservations.find_one({
            "user_phone": current_user.phone,
            "table_id": request.table_id,
            "date": request.date,
            "time": request.time,
            "status": ReservationStatus.LOCKED.value,
            "lock_expiry_time": {"$gt": datetime.now(timezone.utc).isoformat()}
        })
        
        if existing_lock:
            # Return the existing lock instead of creating a new one (idempotent)
            if isinstance(existing_lock.get('created_at'), str):
                existing_lock['created_at'] = datetime.fromisoformat(existing_lock['created_at'])
            # Handle legacy field names
            if 'user_phone' not in existing_lock and 'user_email' in existing_lock:
                existing_lock['user_phone'] = existing_lock['user_email']
            return Reservation(**existing_lock)
        
        # Step 5: Create the lock with TTL using atomic operation
        now = datetime.now(timezone.utc)
        lock_expiry = now + timedelta(minutes=LOCK_TTL_MINUTES)
        reservation_id = str(uuid.uuid4())
        
        reservation_doc = {
            "id": reservation_id,
            "user_phone": current_user.phone,
            "user_email": current_user.email,  # Legacy support
            "user_name": current_user.name,
            "phone": request.phone or current_user.phone,
            "date": request.date,
            "time": request.time,
            "duration_minutes": request.duration_minutes,
            "guests": request.guests,
            "table_id": request.table_id,
            "table_number": table["number"],
            "status": ReservationStatus.LOCKED.value,
            "lock_expiry_time": lock_expiry.isoformat(),
            "special_requests": request.special_requests,
            "created_at": now.isoformat(),
            "confirmed_at": None,
            "sms_sent": False,
            "booked_by_role": current_user.role
        }
        
        try:
            await db.reservations.insert_one(reservation_doc)
            
        except Exception as e:
            logging.error(f"Error creating lock with pessimistic locking: {e}")
            raise HTTPException(status_code=500, detail="Failed to lock table. Please try again.")
        
        reservation_doc['created_at'] = now
        return Reservation(**reservation_doc)


@api_router.post("/reservations/confirm", response_model=Reservation)
async def confirm_reservation_with_pessimistic_lock(request: ConfirmReservationRequest, current_user: User = Depends(get_current_user)):
    """
    Confirm a locked reservation (convert LOCKED → CONFIRMED).
    Uses PESSIMISTIC LOCKING on the reservation to ensure atomic state transition.
    Sends SMS confirmation to the customer upon successful confirmation.
    
    Requirements:
    1. Reservation must exist and belong to the user
    2. Reservation must be in LOCKED status
    3. Lock must not have expired
    """
    # Acquire pessimistic lock for this reservation
    async with lock_manager.lock_resource(f"reservation:{request.reservation_id}"):
        now = datetime.now(timezone.utc)
        
        # Find the reservation
        reservation = await db.reservations.find_one({"id": request.reservation_id}, {"_id": 0})
        
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Verify ownership - check both phone and email for legacy support
        user_phone = reservation.get("user_phone", reservation.get("user_email"))
        is_owner = (user_phone == current_user.phone or 
                   reservation.get("user_email") == current_user.email or
                   reservation.get("user_phone") == current_user.phone)
        is_agent_or_admin = current_user.role in [UserRole.AGENT.value, UserRole.ADMIN.value]
        
        if not is_owner and not is_agent_or_admin:
            raise HTTPException(status_code=403, detail="Not authorized to confirm this reservation")
        
        # Check current status
        if reservation["status"] == ReservationStatus.CONFIRMED.value:
            # Already confirmed - idempotent response
            if isinstance(reservation.get('created_at'), str):
                reservation['created_at'] = datetime.fromisoformat(reservation['created_at'])
            if isinstance(reservation.get('confirmed_at'), str):
                reservation['confirmed_at'] = datetime.fromisoformat(reservation['confirmed_at'])
            # Handle legacy field names
            if 'user_phone' not in reservation and 'user_email' in reservation:
                reservation['user_phone'] = reservation['user_email']
            return Reservation(**reservation)
        
        if reservation["status"] != ReservationStatus.LOCKED.value:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot confirm reservation with status '{reservation['status']}'. Only locked reservations can be confirmed."
            )
        
        # Check if lock has expired
        lock_expiry = reservation.get("lock_expiry_time")
        if lock_expiry:
            expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
            if expiry_time <= now:
                # Mark as expired
                await db.reservations.update_one(
                    {"id": request.reservation_id},
                    {"$set": {"status": ReservationStatus.EXPIRED.value}}
                )
                raise HTTPException(
                    status_code=410,  # Gone
                    detail="Lock has expired. Please create a new reservation."
                )
        
        # Also acquire pessimistic lock on the table during confirmation
        async with lock_manager.lock_resource(f"table_confirmation:{reservation['table_id']}"):
            # Perform conditional update: LOCKED → CONFIRMED
            result = await db.reservations.update_one(
                {
                    "id": request.reservation_id,
                    "status": ReservationStatus.LOCKED.value,
                },
                {
                    "$set": {
                        "status": ReservationStatus.CONFIRMED.value,
                        "confirmed_at": now.isoformat(),
                        "lock_expiry_time": None  # Clear the lock expiry
                    }
                }
            )
            
            if result.modified_count == 0:
                # Race condition: lock expired or status changed
                raise HTTPException(
                    status_code=409,
                    detail="Could not confirm reservation. Lock may have expired or been modified."
                )
        
        # Fetch and return the updated reservation
        updated_reservation = await db.reservations.find_one({"id": request.reservation_id}, {"_id": 0})
        
        if isinstance(updated_reservation.get('created_at'), str):
            updated_reservation['created_at'] = datetime.fromisoformat(updated_reservation['created_at'])
        if isinstance(updated_reservation.get('confirmed_at'), str):
            updated_reservation['confirmed_at'] = datetime.fromisoformat(updated_reservation['confirmed_at'])
        
        # Send SMS confirmation to customer
        customer_phone = updated_reservation.get('phone') or updated_reservation.get('user_phone') or updated_reservation.get('user_email')
        if customer_phone and not customer_phone.startswith('@'):  # Don't send to email addresses
            booking_details = {
                "date": updated_reservation.get('date'),
                "time": updated_reservation.get('time'),
                "guests": updated_reservation.get('guests'),
                "table_number": updated_reservation.get('table_number'),
                "reservation_id": updated_reservation.get('id')
            }
            sms_result = await sms_service.send_booking_confirmation(customer_phone, booking_details)
            
            # Update SMS sent status
            await db.reservations.update_one(
                {"id": request.reservation_id},
                {"$set": {"sms_sent": sms_result.get("status") == "success"}}
            )
            
            updated_reservation['sms_sent'] = sms_result.get("status") == "success"
        
        # Handle legacy field names for response
        if 'user_phone' not in updated_reservation and 'user_email' in updated_reservation:
            updated_reservation['user_phone'] = updated_reservation['user_email']
        
        return Reservation(**updated_reservation)


@api_router.delete("/reservations/{reservation_id}/cancel")
async def cancel_reservation_with_pessimistic_lock(reservation_id: str, current_user: User = Depends(get_current_user)):
    """
    Cancel a reservation (works for both LOCKED and CONFIRMED reservations).
    Uses pessimistic locking to prevent concurrent modifications.
    Sends SMS cancellation notice for confirmed reservations.
    """
    # Acquire pessimistic lock for this reservation
    async with lock_manager.lock_resource(f"reservation_cancel:{reservation_id}"):
        reservation = await db.reservations.find_one({"id": reservation_id})
        
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Verify ownership or agent/admin
        user_phone = reservation.get("user_phone", reservation.get("user_email"))
        is_owner = (user_phone == current_user.phone or 
                   reservation.get("user_email") == current_user.email or
                   reservation.get("user_phone") == current_user.phone)
        is_agent_or_admin = current_user.role in [UserRole.AGENT.value, UserRole.ADMIN.value]
        
        if not is_owner and not is_agent_or_admin:
            raise HTTPException(status_code=403, detail="Not authorized to cancel this reservation")
        
        # Can cancel LOCKED or CONFIRMED reservations
        if reservation["status"] not in [ReservationStatus.LOCKED.value, ReservationStatus.CONFIRMED.value]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel reservation with status '{reservation['status']}'"
            )
        
        was_confirmed = reservation["status"] == ReservationStatus.CONFIRMED.value
        
        # Update status to cancelled
        await db.reservations.update_one(
            {"id": reservation_id},
            {"$set": {"status": ReservationStatus.CANCELLED.value}}
        )
        
        # Send SMS cancellation notice if it was a confirmed reservation
        if was_confirmed:
            customer_phone = reservation.get('phone') or reservation.get('user_phone') or reservation.get('user_email')
            if customer_phone and not customer_phone.startswith('@'):
                booking_details = {
                    "date": reservation.get('date'),
                    "time": reservation.get('time')
                }
                await sms_service.send_booking_cancellation(customer_phone, booking_details)
    
    return {"message": "Reservation cancelled successfully", "reservation_id": reservation_id}


@api_router.post("/reservations/release-expired")
async def release_expired_locks_with_pessimistic_lock(current_user: User = Depends(get_current_admin)):
    """
    Manually trigger release of all expired locks.
    Uses pessimistic locking on each reservation to prevent race conditions.
    """
    now = datetime.now(timezone.utc)
    
    # Find expired locks
    expired_reservations = await db.reservations.find(
        {
            "status": ReservationStatus.LOCKED.value,
            "lock_expiry_time": {"$lt": now.isoformat()}
        },
        {"_id": 0, "id": 1}
    ).to_list(1000)
    
    released_count = 0
    
    for res in expired_reservations:
        # Use pessimistic lock for each reservation
        async with lock_manager.lock_resource(f"reservation_expire:{res['id']}"):
            # Re-check condition with lock
            current_res = await db.reservations.find_one(
                {"id": res['id'], "status": ReservationStatus.LOCKED.value},
                {"_id": 0, "lock_expiry_time": 1}
            )
            
            if current_res and current_res.get("lock_expiry_time"):
                expiry_time = datetime.fromisoformat(current_res["lock_expiry_time"].replace('Z', '+00:00'))
                if expiry_time <= now:
                    # Mark as expired
                    result = await db.reservations.update_one(
                        {"id": res['id']},
                        {"$set": {"status": ReservationStatus.EXPIRED.value}}
                    )
                    if result.modified_count > 0:
                        released_count += 1
    
    return {
        "message": f"Released {released_count} expired locks",
        "released_count": released_count
    }


@api_router.get("/reservations/{reservation_id}", response_model=Reservation)
async def get_reservation_with_pessimistic_lock(reservation_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific reservation by ID (read-only, no lock needed)"""
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check ownership or agent/admin
    user_phone = reservation.get("user_phone", reservation.get("user_email"))
    is_owner = (user_phone == current_user.phone or 
               reservation.get("user_email") == current_user.email or
               reservation.get("user_phone") == current_user.phone)
    is_agent_or_admin = current_user.role in [UserRole.AGENT.value, UserRole.ADMIN.value]
    
    if not is_owner and not is_agent_or_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
    
    if isinstance(reservation.get('created_at'), str):
        reservation['created_at'] = datetime.fromisoformat(reservation['created_at'])
    if isinstance(reservation.get('confirmed_at'), str):
        reservation['confirmed_at'] = datetime.fromisoformat(reservation['confirmed_at'])
    
    # Handle legacy field names
    if 'user_phone' not in reservation and 'user_email' in reservation:
        reservation['user_phone'] = reservation['user_email']
    
    return Reservation(**reservation)


@api_router.get("/reservations/{reservation_id}/status")
async def check_reservation_status_with_pessimistic_lock(reservation_id: str):
    """
    Check the current status of a reservation (public endpoint for checking lock status).
    Uses pessimistic locking to ensure accurate status.
    """
    # Acquire read lock for this reservation
    async with lock_manager.lock_resource(f"reservation_status:{reservation_id}"):
        reservation = await db.reservations.find_one(
            {"id": reservation_id},
            {"_id": 0, "id": 1, "status": 1, "lock_expiry_time": 1}
        )
        
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        now = datetime.now(timezone.utc)
        status = reservation["status"]
        lock_remaining_seconds = None
        
        # Check if lock is still valid
        if status == ReservationStatus.LOCKED.value:
            lock_expiry = reservation.get("lock_expiry_time")
            if lock_expiry:
                expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
                if expiry_time <= now:
                    # Acquire write lock to update status
                    async with lock_manager.lock_resource(f"reservation_expire_update:{reservation_id}"):
                        # Re-check before updating
                        current_res = await db.reservations.find_one(
                            {"id": reservation_id, "status": ReservationStatus.LOCKED.value},
                            {"_id": 0, "lock_expiry_time": 1}
                        )
                        if current_res and current_res.get("lock_expiry_time"):
                            current_expiry = datetime.fromisoformat(current_res["lock_expiry_time"].replace('Z', '+00:00'))
                            if current_expiry <= now:
                                # Mark as expired
                                await db.reservations.update_one(
                                    {"id": reservation_id},
                                    {"$set": {"status": ReservationStatus.EXPIRED.value}}
                                )
                                status = ReservationStatus.EXPIRED.value
                else:
                    lock_remaining_seconds = int((expiry_time - now).total_seconds())
        
        return {
            "reservation_id": reservation_id,
            "status": status,
            "lock_remaining_seconds": lock_remaining_seconds
        }


# ============================================================================
# TABLE MANAGEMENT WITH PESSIMISTIC LOCKING
# ============================================================================

@api_router.get("/tables", response_model=List[Table])
async def get_tables():
    """Get all tables (read-only, no lock needed)"""
    tables = await db.tables.find({}, {"_id": 0}).to_list(1000)
    return [Table(**t) for t in tables]


@api_router.get("/tables/{table_id}", response_model=Table)
async def get_table(table_id: str):
    """Get a specific table by ID (read-only, no lock needed)"""
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return Table(**table)


@api_router.post("/tables", response_model=Table)
async def create_table_with_pessimistic_lock(table: TableCreate, current_user: User = Depends(get_current_admin)):
    """Create a new table (admin only) with pessimistic locking"""
    # Use a global lock for table creation to prevent duplicate table numbers
    async with lock_manager.lock_resource("table_creation:global"):
        # Check for duplicate table number
        existing = await db.tables.find_one({"number": table.number})
        if existing:
            raise HTTPException(status_code=400, detail="Table number already exists")
        
        table_dict = table.model_dump()
        table_dict['id'] = str(uuid.uuid4())
        table_dict['status'] = TableStatus.AVAILABLE.value
        
        await db.tables.insert_one(table_dict)
        
        return Table(**table_dict)


@api_router.put("/tables/{table_id}", response_model=Table)
async def update_table_with_pessimistic_lock(table_id: str, table: TableCreate, current_user: User = Depends(get_current_admin)):
    """Update a table (admin only) with pessimistic locking"""
    # Acquire lock for this specific table
    async with lock_manager.lock_resource(f"table_update:{table_id}"):
        # Check for duplicate table number (excluding current table)
        if table.number:
            existing = await db.tables.find_one({"number": table.number, "id": {"$ne": table_id}})
            if existing:
                raise HTTPException(status_code=400, detail="Table number already exists")
        
        table_dict = table.model_dump()
        
        result = await db.tables.update_one(
            {"id": table_id},
            {"$set": table_dict}
        )
        
        if result.modified_count == 0:
            existing = await db.tables.find_one({"id": table_id})
            if not existing:
                raise HTTPException(status_code=404, detail="Table not found")
        
        updated = await db.tables.find_one({"id": table_id}, {"_id": 0})
        return Table(**updated)


@api_router.delete("/tables/{table_id}")
async def delete_table_with_pessimistic_lock(table_id: str, current_user: User = Depends(get_current_admin)):
    """Delete a table (admin only) with pessimistic locking"""
    # Acquire lock for this specific table
    async with lock_manager.lock_resource(f"table_delete:{table_id}"):
        # Check for active reservations on this table
        active_reservations = await db.reservations.count_documents({
            "table_id": table_id,
            "status": {"$in": [ReservationStatus.LOCKED.value, ReservationStatus.CONFIRMED.value]}
        })
        
        if active_reservations > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete table with active reservations"
            )
        
        result = await db.tables.delete_one({"id": table_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Table not found")
        
        return {"message": "Table deleted successfully"}


@api_router.get("/tables/{table_id}/schedule")
async def get_table_schedule_with_pessimistic_lock(table_id: str, date: str):
    """
    Get the schedule for a specific table on a given date.
    Uses pessimistic locking to ensure consistent view.
    """
    # Acquire read lock for this table
    async with lock_manager.lock_resource(f"table_schedule:{table_id}"):
        table = await db.tables.find_one({"id": table_id}, {"_id": 0})
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        reservations = await db.reservations.find(
            {
                "table_id": table_id,
                "date": date,
                "status": {"$in": [ReservationStatus.LOCKED.value, ReservationStatus.CONFIRMED.value]}
            },
            {"_id": 0}
        ).sort("time", 1).to_list(100)
        
        # Check and update expired locks with write lock
        now = datetime.now(timezone.utc)
        valid_reservations = []
        
        for res in reservations:
            if res["status"] == ReservationStatus.LOCKED.value:
                lock_expiry = res.get("lock_expiry_time")
                if lock_expiry:
                    expiry_time = datetime.fromisoformat(lock_expiry.replace('Z', '+00:00'))
                    if expiry_time <= now:
                        # Acquire write lock for this reservation
                        async with lock_manager.lock_resource(f"reservation_schedule_expire:{res['id']}"):
                            # Re-check before updating
                            current_res = await db.reservations.find_one(
                                {"id": res["id"], "status": ReservationStatus.LOCKED.value},
                                {"_id": 0, "lock_expiry_time": 1}
                            )
                            if current_res and current_res.get("lock_expiry_time"):
                                current_expiry = datetime.fromisoformat(current_res["lock_expiry_time"].replace('Z', '+00:00'))
                                if current_expiry <= now:
                                    await db.reservations.update_one(
                                        {"id": res["id"]},
                                        {"$set": {"status": ReservationStatus.EXPIRED.value}}
                                    )
                                    continue
            valid_reservations.append({
                "time": res["time"],
                "duration_minutes": res.get("duration_minutes", 90),
                "guests": res["guests"],
                "status": res["status"],
                "user_name": res["user_name"]
            })
        
        return {
            "table": table,
            "date": date,
            "reservations": valid_reservations
        }


# ============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# ============================================================================

@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate, current_user: User = Depends(get_current_user)):
    """
    Legacy endpoint: Creates a reservation directly.
    For the new seat-locking flow, use /reservations/lock followed by /reservations/confirm
    """
    # If table_id is provided, use the new pessimistic locking system
    if reservation.table_id:
        lock_request = LockTableRequest(
            date=reservation.date,
            time=reservation.time,
            guests=reservation.guests,
            table_id=reservation.table_id,
            phone=reservation.phone,
            special_requests=reservation.special_requests,
            duration_minutes=reservation.duration_minutes
        )
        locked = await lock_table_with_pessimistic_lock(lock_request, current_user)
        
        # Auto-confirm for legacy API
        confirm_request = ConfirmReservationRequest(reservation_id=locked.id)
        return await confirm_reservation_with_pessimistic_lock(confirm_request, current_user)
    
    # If no table specified, create pending reservation (admin will assign table)
    async with lock_manager.lock_resource("legacy_reservation:global"):
        reservation_dict = reservation.model_dump()
        reservation_dict['id'] = str(uuid.uuid4())
        reservation_dict['user_email'] = current_user.email
        reservation_dict['user_name'] = current_user.name
        reservation_dict['status'] = 'pending'  # Legacy status for manual assignment
        reservation_dict['created_at'] = datetime.now(timezone.utc).isoformat()
        reservation_dict['lock_expiry_time'] = None
        reservation_dict['confirmed_at'] = None
        
        await db.reservations.insert_one(reservation_dict)
        
        if isinstance(reservation_dict.get('created_at'), str):
            reservation_dict['created_at'] = datetime.fromisoformat(reservation_dict['created_at'])
        
        return Reservation(**reservation_dict)


@api_router.get("/reservations/my", response_model=List[Reservation])
async def get_my_reservations(current_user: User = Depends(get_current_user)):
    """Get all reservations for the current user (read-only, no lock needed)"""
    # Query by phone OR email for legacy support
    reservations = await db.reservations.find(
        {"$or": [
            {"user_phone": current_user.phone},
            {"user_email": current_user.email},
            {"user_email": current_user.phone}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
        if isinstance(res.get('confirmed_at'), str):
            res['confirmed_at'] = datetime.fromisoformat(res['confirmed_at'])
        # Handle legacy field names
        if 'user_phone' not in res and 'user_email' in res:
            res['user_phone'] = res['user_email']
    
    return [Reservation(**res) for res in reservations]


@api_router.get("/reservations", response_model=List[Reservation])
async def get_all_reservations(
    status_filter: Optional[str] = None,
    date_filter: Optional[str] = None,
    current_user: User = Depends(get_current_admin)
):
    """Get all reservations (admin only) with optional filters (read-only, no lock needed)"""
    query = {}
    
    if status_filter:
        query["status"] = status_filter
    if date_filter:
        query["date"] = date_filter
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
        if isinstance(res.get('confirmed_at'), str):
            res['confirmed_at'] = datetime.fromisoformat(res['confirmed_at'])
    
    return [Reservation(**res) for res in reservations]


@api_router.patch("/reservations/{reservation_id}")
async def update_reservation_status(
    reservation_id: str,
    status: str,
    current_user: User = Depends(get_current_admin)
):
    """Admin endpoint to manually update reservation status with pessimistic locking"""
    valid_statuses = [s.value for s in ReservationStatus] + ['pending']  # Include legacy status
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    # Acquire pessimistic lock for this reservation
    async with lock_manager.lock_resource(f"reservation_admin_update:{reservation_id}"):
        update_data = {"status": status}
        if status == ReservationStatus.CONFIRMED.value:
            update_data["confirmed_at"] = datetime.now(timezone.utc).isoformat()
            update_data["lock_expiry_time"] = None
        
        result = await db.reservations.update_one(
            {"id": reservation_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Reservation not found")
    
    return {"message": "Reservation updated successfully"}


@api_router.delete("/reservations/{reservation_id}")
async def cancel_reservation(reservation_id: str, current_user: User = Depends(get_current_user)):
    """Cancel/delete a reservation (legacy endpoint - uses new pessimistic locking)"""
    return await cancel_reservation_with_pessimistic_lock(reservation_id, current_user)


# ============================================================================
# MENU MANAGEMENT (no pessimistic locking needed as menu items are rarely updated concurrently)
# ============================================================================

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    
    for item in menu_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return menu_items


@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, current_user: User = Depends(get_current_admin)):
    import uuid
    
    item_dict = item.model_dump()
    item_dict['id'] = str(uuid.uuid4())
    item_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.menu_items.insert_one(item_dict)
    
    return MenuItem(**item_dict)


@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item: MenuItemCreate, current_user: User = Depends(get_current_admin)):
    item_dict = item.model_dump()
    
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": item_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    updated_item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    
    if isinstance(updated_item.get('created_at'), str):
        updated_item['created_at'] = datetime.fromisoformat(updated_item['created_at'])
    
    return MenuItem(**updated_item)


@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.menu_items.delete_one({"id": item_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return {"message": "Menu item deleted successfully"}


# ============================================================================
# CAFE INFO & STATS (read-only or admin-only with simple locking)
# ============================================================================

@api_router.get("/cafe-info", response_model=CafeInfo)
async def get_cafe_info():
    info = await db.cafe_info.find_one({"id": "main"}, {"_id": 0})
    
    if not info:
        default_info = {
            "id": "main",
            "name": "Lumière Café",
            "description": "A cozy, premium café where every moment feels like a warm sip of coffee",
            "address": "123 Main Street, Downtown",
            "phone": "+1 (555) 123-4567",
            "email": "hello@lumierecafe.com",
            "hours": {
                "Monday-Friday": "7:00 AM - 9:00 PM",
                "Saturday-Sunday": "8:00 AM - 10:00 PM"
            },
            "social_media": {
                "instagram": "@lumierecafe",
                "facebook": "lumierecafe"
            }
        }
        await db.cafe_info.insert_one(default_info)
        return CafeInfo(**default_info)
    
    return CafeInfo(**info)


@api_router.put("/cafe-info", response_model=CafeInfo)
async def update_cafe_info(info: CafeInfo, current_user: User = Depends(get_current_admin)):
    info_dict = info.model_dump()
    
    # Simple lock for cafe info updates
    async with lock_manager.lock_resource("cafe_info:main"):
        await db.cafe_info.update_one(
            {"id": "main"},
            {"$set": info_dict},
            upsert=True
        )
    
    return info


@api_router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_admin)):
    """Get dashboard statistics (admin only) - uses atomic MongoDB operations"""
    total_reservations = await db.reservations.count_documents({})
    pending_reservations = await db.reservations.count_documents({"status": "pending"})
    locked_reservations = await db.reservations.count_documents({"status": ReservationStatus.LOCKED.value})
    confirmed_reservations = await db.reservations.count_documents({"status": ReservationStatus.CONFIRMED.value})
    cancelled_reservations = await db.reservations.count_documents({"status": ReservationStatus.CANCELLED.value})
    expired_reservations = await db.reservations.count_documents({"status": ReservationStatus.EXPIRED.value})
    total_users = await db.users.count_documents({"role": "customer"})
    total_menu_items = await db.menu_items.count_documents({})
    total_tables = await db.tables.count_documents({})
    
    # Today's reservations
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    todays_reservations = await db.reservations.count_documents({
        "date": today,
        "status": ReservationStatus.CONFIRMED.value
    })
    
    return {
        "total_reservations": total_reservations,
        "pending_reservations": pending_reservations,
        "locked_reservations": locked_reservations,
        "confirmed_reservations": confirmed_reservations,
        "cancelled_reservations": cancelled_reservations,
        "expired_reservations": expired_reservations,
        "todays_reservations": todays_reservations,
        "total_users": total_users,
        "total_menu_items": total_menu_items,
        "total_tables": total_tables
    }


# ============================================================================
# LOCK MANAGEMENT ENDPOINTS (for monitoring and debugging)
# ============================================================================

@api_router.get("/locks/status")
async def get_lock_status(current_user: User = Depends(get_current_admin)):
    """
    Get current status of all pessimistic locks (admin only).
    Useful for debugging and monitoring.
    """
    # Note: This is a simplified view. In production, you might want to
    # implement more detailed lock tracking.
    return {
        "message": "Pessimistic locking system is active",
        "timeout_seconds": PESSIMISTIC_LOCK_TIMEOUT,
        "lock_ttl_minutes": LOCK_TTL_MINUTES
    }


@api_router.post("/locks/force-release/{resource_id}")
async def force_release_lock(resource_id: str, current_user: User = Depends(get_current_admin)):
    """
    Force release a pessimistic lock (admin only).
    Use with caution - only for emergency situations.
    """
    await lock_manager.release(resource_id)
    return {"message": f"Force-released lock for resource: {resource_id}"}


# ============================================================================
# AGENT DASHBOARD ENDPOINTS
# ============================================================================

class AgentBookingRequest(BaseModel):
    """Request model for agent to create booking on behalf of customer"""
    customer_phone: str
    customer_name: str
    date: str
    time: str
    guests: int
    table_id: str
    special_requests: Optional[str] = None
    duration_minutes: int = 90
    
    @field_validator('customer_phone')
    @classmethod
    def validate_phone(cls, v):
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?[1-9]\d{6,14}$', cleaned):
            raise ValueError('Invalid phone number format')
        return cleaned


@api_router.get("/agent/dashboard")
async def get_agent_dashboard(current_user: User = Depends(get_current_agent)):
    """
    Get dashboard data for agents showing today's bookings and upcoming reservations.
    Agents can view all reservations to manage the café floor.
    """
    # Use local time (IST is UTC+5:30) for date comparisons
    # This ensures "today" matches the dates users input in the frontend
    from datetime import timezone as tz
    
    # Get current time in IST (UTC+5:30)
    ist_offset = timedelta(hours=5, minutes=30)
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc + ist_offset
    
    today = now_ist.strftime("%Y-%m-%d")
    current_time = now_ist.strftime("%H:%M")
    week_from_now = (now_ist + timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Today's confirmed reservations
    todays_bookings = await db.reservations.find(
        {
            "date": today,
            "status": ReservationStatus.CONFIRMED.value
        },
        {"_id": 0}
    ).sort("time", 1).to_list(100)
    
    # Currently locked tables (active locks)
    current_locks = await db.reservations.find(
        {
            "date": today,
            "status": ReservationStatus.LOCKED.value,
            "lock_expiry_time": {"$gt": now_utc.isoformat()}
        },
        {"_id": 0}
    ).to_list(100)
    
    # Upcoming reservations (next 7 days)
    upcoming_bookings = await db.reservations.find(
        {
            "date": {"$gt": today, "$lte": week_from_now},
            "status": ReservationStatus.CONFIRMED.value
        },
        {"_id": 0}
    ).sort([("date", 1), ("time", 1)]).to_list(100)
    
    # Process reservations
    def process_reservation(res):
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
        if isinstance(res.get('confirmed_at'), str):
            res['confirmed_at'] = datetime.fromisoformat(res['confirmed_at'])
        if 'user_phone' not in res and 'user_email' in res:
            res['user_phone'] = res['user_email']
        return res
    
    todays_bookings = [process_reservation(r) for r in todays_bookings]
    current_locks = [process_reservation(r) for r in current_locks]
    upcoming_bookings = [process_reservation(r) for r in upcoming_bookings]
    
    # Stats
    stats = {
        "todays_total": len(todays_bookings),
        "todays_pending_arrival": len([b for b in todays_bookings if b.get('time', '00:00') > current_time]),
        "current_locks": len(current_locks),
        "upcoming_week": len(upcoming_bookings)
    }
    
    return {
        "today": today,
        "stats": stats,
        "todays_bookings": [Reservation(**r).model_dump() for r in todays_bookings],
        "current_locks": [Reservation(**r).model_dump() for r in current_locks],
        "upcoming_bookings": [Reservation(**r).model_dump() for r in upcoming_bookings]
    }


@api_router.get("/agent/reservations")
async def get_agent_reservations(
    date: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_agent)
):
    """
    Get reservations with filters for agent management.
    Can filter by date, status, and search by customer name/phone.
    """
    query = {}
    
    if date:
        query["date"] = date
    
    if status_filter:
        query["status"] = status_filter
    
    if search:
        # Search by name or phone
        query["$or"] = [
            {"user_name": {"$regex": search, "$options": "i"}},
            {"user_phone": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    reservations = await db.reservations.find(query, {"_id": 0}).sort([("date", -1), ("time", 1)]).to_list(500)
    
    for res in reservations:
        if isinstance(res.get('created_at'), str):
            res['created_at'] = datetime.fromisoformat(res['created_at'])
        if isinstance(res.get('confirmed_at'), str):
            res['confirmed_at'] = datetime.fromisoformat(res['confirmed_at'])
        if 'user_phone' not in res and 'user_email' in res:
            res['user_phone'] = res['user_email']
    
    return [Reservation(**res) for res in reservations]


@api_router.post("/agent/book-for-customer", response_model=Reservation)
async def agent_book_for_customer(request: AgentBookingRequest, current_user: User = Depends(get_current_agent)):
    """
    Agent can create a booking on behalf of a customer.
    The booking is immediately confirmed (no lock step needed).
    SMS confirmation is sent to the customer.
    """
    # Acquire pessimistic lock for this table
    async with lock_manager.lock_resource(f"table_lock:{request.table_id}"):
        # Validate table exists and has capacity
        table = await db.tables.find_one({"id": request.table_id}, {"_id": 0})
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        if table["capacity"] < request.guests:
            raise HTTPException(
                status_code=400,
                detail=f"Table capacity ({table['capacity']}) is less than requested guests ({request.guests})"
            )
        
        if not table.get("available", True):
            raise HTTPException(status_code=400, detail="Table is not available for reservations")
        
        # Check for conflicting reservations
        conflicts = await get_conflicting_reservations_with_pessimistic_lock(
            request.table_id,
            request.date,
            request.time,
            request.duration_minutes
        )
        
        if conflicts:
            raise HTTPException(
                status_code=409,
                detail="Table is not available for this time slot. Please choose another time or table."
            )
        
        # Create confirmed reservation directly
        now = datetime.now(timezone.utc)
        reservation_id = str(uuid.uuid4())
        
        reservation_doc = {
            "id": reservation_id,
            "user_phone": request.customer_phone,
            "user_name": request.customer_name,
            "phone": request.customer_phone,
            "date": request.date,
            "time": request.time,
            "duration_minutes": request.duration_minutes,
            "guests": request.guests,
            "table_id": request.table_id,
            "table_number": table["number"],
            "status": ReservationStatus.CONFIRMED.value,
            "lock_expiry_time": None,
            "special_requests": request.special_requests,
            "created_at": now.isoformat(),
            "confirmed_at": now.isoformat(),
            "sms_sent": False,
            "booked_by_role": UserRole.AGENT.value,
            "booked_by_agent": current_user.name
        }
        
        await db.reservations.insert_one(reservation_doc)
        
        # Send SMS confirmation to customer
        booking_details = {
            "date": request.date,
            "time": request.time,
            "guests": request.guests,
            "table_number": table["number"],
            "reservation_id": reservation_id
        }
        sms_result = await sms_service.send_booking_confirmation(request.customer_phone, booking_details)
        
        # Update SMS sent status
        if sms_result.get("status") == "success":
            await db.reservations.update_one(
                {"id": reservation_id},
                {"$set": {"sms_sent": True}}
            )
            reservation_doc['sms_sent'] = True
        
        reservation_doc['created_at'] = now
        reservation_doc['confirmed_at'] = now
        
        return Reservation(**reservation_doc)


@api_router.post("/agent/send-reminder/{reservation_id}")
async def agent_send_reminder(reservation_id: str, current_user: User = Depends(get_current_agent)):
    """
    Send a reminder SMS to a customer about their upcoming reservation.
    """
    reservation = await db.reservations.find_one({"id": reservation_id}, {"_id": 0})
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    if reservation["status"] != ReservationStatus.CONFIRMED.value:
        raise HTTPException(status_code=400, detail="Can only send reminders for confirmed reservations")
    
    customer_phone = reservation.get('phone') or reservation.get('user_phone')
    if not customer_phone or customer_phone.startswith('@'):
        raise HTTPException(status_code=400, detail="No valid phone number for this reservation")
    
    # Send reminder SMS
    message = f"""⏰ Reminder: Your reservation at Lumière Café

📅 Date: {reservation.get('date')}
🕐 Time: {reservation.get('time')}
👥 Guests: {reservation.get('guests')}
🪑 Table: #{reservation.get('table_number')}

See you soon! ☕

Lumière Café"""
    
    sms_result = await sms_service.send_sms(customer_phone, message)
    
    return {
        "message": "Reminder sent successfully",
        "sms_status": sms_result.get("status"),
        "phone": customer_phone
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)