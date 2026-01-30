import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from passlib.context import CryptContext
from datetime import datetime, timedelta
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    print("Seeding database...")
    
    # Create indexes for the reservation system
    print("Creating indexes...")
    await db.reservations.create_index([("table_id", 1), ("date", 1), ("time", 1)])
    await db.reservations.create_index([("status", 1), ("lock_expiry_time", 1)])
    await db.reservations.create_index([("user_email", 1)])
    await db.reservations.create_index([("user_phone", 1)])
    await db.tables.create_index([("capacity", 1)])
    await db.users.create_index([("phone", 1)], unique=True, sparse=True)
    await db.otps.create_index([("phone", 1)])
    await db.otps.create_index([("expires_at", 1)], expireAfterSeconds=0)
    print("✅ Indexes created")
    
    existing_admin = await db.users.find_one({"email": "admin@lumiere.com"})
    if not existing_admin:
        admin_user = {
            "email": "admin@lumiere.com",
            "phone": "+919999999999",
            "name": "Admin User",
            "role": "admin",
            "hashed_password": pwd_context.hash("admin123"),
            "created_at": "2025-01-01T00:00:00"
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created (phone: +919999999999 or admin@lumiere.com / admin123)")
    
    existing_agent = await db.users.find_one({"phone": "+919888888888"})
    if not existing_agent:
        agent_user = {
            "phone": "+919888888888",
            "name": "Agent Smith",
            "role": "agent",
            "created_at": "2025-01-01T00:00:00"
        }
        await db.users.insert_one(agent_user)
        print("✅ Agent user created (phone: +919888888888 - use OTP to login)")
    
    existing_customer = await db.users.find_one({"email": "customer@example.com"})
    if not existing_customer:
        customer_user = {
            "email": "customer@example.com",
            "phone": "+919777777777",
            "name": "John Doe",
            "role": "customer",
            "hashed_password": pwd_context.hash("customer123"),
            "created_at": "2025-01-01T00:00:00"
        }
        await db.users.insert_one(customer_user)
        print("✅ Customer user created (phone: +919777777777 or customer@example.com / customer123)")
    
    menu_count = await db.menu_items.count_documents({})
    if menu_count == 0:
        menu_items = [
            # Appetizers
            {
                "id": "1",
                "name": "Garlic Bread",
                "description": "Freshly baked bread topped with garlic butter and herbs, served warm with crispy edges",
                "category": "Appetizers",
                "price": 130.00,
                "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "2",
                "name": "Cheesy Garlic Bread",
                "description": "Golden garlic bread topped with melted cheese blend, baked to perfection",
                "category": "Appetizers",
                "price": 150.00,
                "image": "https://images.unsplash.com/photo-1619740455993-9e0c7c1d80e4?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "3",
                "name": "French Fries",
                "description": "Crispy golden fries seasoned with herbs and served with tangy dipping sauce",
                "category": "Appetizers",
                "price": 130.00,
                "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "4",
                "name": "Pan Fried Mushrooms",
                "description": "Fresh mushrooms pan-fried to perfection with aromatic herbs and garlic",
                "category": "Appetizers",
                "price": 180.00,
                "image": "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Salads
            {
                "id": "5",
                "name": "Honey & Spice Salad",
                "description": "Fresh mixed greens with honey dressing and spicy peanuts for the perfect balance",
                "category": "Salads",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "6",
                "name": "Chicken & Walnut Salad",
                "description": "Tender chicken pieces with crunchy walnuts and fresh seasonal vegetables",
                "category": "Salads",
                "price": 250.00,
                "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Breakfast
            {
                "id": "7",
                "name": "Egg Sandwich",
                "description": "Perfectly cooked eggs with fresh vegetables and herbs on toasted bread",
                "category": "Breakfast",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "8",
                "name": "French Toast",
                "description": "Classic French toast with cinnamon, vanilla, and maple syrup",
                "category": "Breakfast",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "9",
                "name": "The English Breakfast",
                "description": "Complete English breakfast with eggs, sausages, bacon, beans, and toast",
                "category": "Breakfast",
                "price": 400.00,
                "image": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Originals
            {
                "id": "10",
                "name": "Egg Wrapped Ramen",
                "description": "Our signature ramen wrapped in a perfectly cooked egg, creating layers of flavor",
                "category": "Originals",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "11",
                "name": "The Bacon Special",
                "description": "Premium bacon preparation with our special sauce and cooking technique",
                "category": "Originals",
                "price": 300.00,
                "image": "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Burgers
            {
                "id": "12",
                "name": "Classic Veggie Burger",
                "description": "Fresh vegetable patty with lettuce, tomato, and creamy sauce",
                "category": "Burgers",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "13",
                "name": "Classic Chicken Burger",
                "description": "Grilled chicken breast with fresh vegetables and herbs in soft bun",
                "category": "Burgers",
                "price": 220.00,
                "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Beverages
            {
                "id": "14",
                "name": "Filter Coffee",
                "description": "Authentic South Indian filter coffee served hot with rich aroma",
                "category": "Beverages",
                "price": 100.00,
                "image": "https://images.unsplash.com/photo-1509048191080-d2b6ca099d14?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "15",
                "name": "Cold Coffee",
                "description": "Refreshing cold coffee blend served over ice with cream",
                "category": "Beverages",
                "price": 160.00,
                "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "16",
                "name": "Affogato Filter Coffee",
                "description": "Rich filter coffee poured over vanilla ice cream for a delightful treat",
                "category": "Beverages",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "17",
                "name": "Hot Chocolate",
                "description": "Rich and creamy hot chocolate topped with froth",
                "category": "Beverages",
                "price": 150.00,
                "image": "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            # Desserts
            {
                "id": "18",
                "name": "Brownie",
                "description": "Rich chocolate brownie baked fresh daily with premium cocoa",
                "category": "Desserts",
                "price": 100.00,
                "image": "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
            {
                "id": "19",
                "name": "Brownie & Ice Cream",
                "description": "Warm chocolate brownie served with vanilla ice cream",
                "category": "Desserts",
                "price": 200.00,
                "image": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800",
                "available": True,
                "created_at": "2025-01-01T00:00:00"
            },
        ]
        await db.menu_items.insert_many(menu_items)
        print(f"✅ {len(menu_items)} menu items created")
    
    tables_count = await db.tables.count_documents({})
    if tables_count == 0:
        tables = [
            # Small tables (2 capacity) - for couples or small meetings
            {"id": "t1", "number": 1, "capacity": 2, "location": "Window Side", "available": True, "status": "available"},
            {"id": "t2", "number": 2, "capacity": 2, "location": "Corner", "available": True, "status": "available"},
            {"id": "t3", "number": 3, "capacity": 2, "location": "Bar Counter", "available": True, "status": "available"},
            {"id": "t4", "number": 4, "capacity": 2, "location": "Garden View", "available": True, "status": "available"},
            # Medium tables (4 capacity) - for families or groups
            {"id": "t5", "number": 5, "capacity": 4, "location": "Center", "available": True, "status": "available"},
            {"id": "t6", "number": 6, "capacity": 4, "location": "Window Side", "available": True, "status": "available"},
            {"id": "t7", "number": 7, "capacity": 4, "location": "Patio", "available": True, "status": "available"},
            {"id": "t8", "number": 8, "capacity": 4, "location": "Main Hall", "available": True, "status": "available"},
            # Large tables (6 capacity) - for bigger groups
            {"id": "t9", "number": 9, "capacity": 6, "location": "Private Room", "available": True, "status": "available"},
            {"id": "t10", "number": 10, "capacity": 6, "location": "Patio", "available": True, "status": "available"},
            # Extra large tables (8 capacity) - for events
            {"id": "t11", "number": 11, "capacity": 8, "location": "Event Space", "available": True, "status": "available"},
            {"id": "t12", "number": 12, "capacity": 8, "location": "Private Room", "available": True, "status": "available"},
        ]
        await db.tables.insert_many(tables)
        print(f"✅ {len(tables)} tables created with various capacities")
    
    cafe_info = await db.cafe_info.find_one({"id": "main"})
    if not cafe_info:
        info = {
            "id": "main",
            "name": "Isai Café",
            "description": "Where music and home blend into one - an art café experience",
            "address": "123 Art Street, Music District",
            "phone": "+91 98765 43210",
            "email": "hello@isai.cafe",
            "hours": {
                "Monday": "CLOSED",
                "Tuesday-Saturday": "6:00 AM - 4:00 PM",
                "Sunday": "CLOSED"
            },
            "social_media": {
                "instagram": "@isai.artcafe",
                "facebook": "isaiartcafe"
            }
        }
        await db.cafe_info.insert_one(info)
        print("✅ Café info created")
    
    # Seed sample reservations for testing
    reservations_count = await db.reservations.count_documents({})
    if reservations_count == 0:
        today = datetime.now().strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        
        sample_reservations = [
            # Today's reservations
            {
                "id": str(uuid.uuid4()),
                "table_id": "t1",
                "table_number": 1,
                "user_id": None,
                "user_email": "priya.sharma@email.com",
                "user_phone": "+919876543210",
                "user_name": "Priya Sharma",
                "date": today,
                "time": "09:00",
                "guests": 2,
                "status": "confirmed",
                "special_requests": "Window seat preferred",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "table_id": "t5",
                "table_number": 5,
                "user_id": None,
                "user_email": "rahul.kumar@email.com",
                "user_phone": "+919876543211",
                "user_name": "Rahul Kumar",
                "date": today,
                "time": "10:30",
                "guests": 4,
                "status": "confirmed",
                "special_requests": "Birthday celebration - need cake",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "table_id": "t3",
                "table_number": 3,
                "user_id": None,
                "user_email": "meera.patel@email.com",
                "user_phone": "+919876543212",
                "user_name": "Meera Patel",
                "date": today,
                "time": "12:00",
                "guests": 2,
                "status": "confirmed",
                "special_requests": "",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "table_id": "t9",
                "table_number": 9,
                "user_id": None,
                "user_email": "vijay.singh@email.com",
                "user_phone": "+919876543213",
                "user_name": "Vijay Singh",
                "date": today,
                "time": "14:00",
                "guests": 6,
                "status": "confirmed",
                "special_requests": "Business meeting - need privacy",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            # Tomorrow's reservations
            {
                "id": str(uuid.uuid4()),
                "table_id": "t2",
                "table_number": 2,
                "user_id": None,
                "user_email": "anita.desai@email.com",
                "user_phone": "+919876543214",
                "user_name": "Anita Desai",
                "date": tomorrow,
                "time": "08:00",
                "guests": 2,
                "status": "confirmed",
                "special_requests": "Anniversary - special dessert please",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "table_id": "t6",
                "table_number": 6,
                "user_id": None,
                "user_email": "kiran.reddy@email.com",
                "user_phone": "+919876543215",
                "user_name": "Kiran Reddy",
                "date": tomorrow,
                "time": "11:00",
                "guests": 4,
                "status": "confirmed",
                "special_requests": "Vegetarian menu only",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            # Day after tomorrow
            {
                "id": str(uuid.uuid4()),
                "table_id": "t11",
                "table_number": 11,
                "user_id": None,
                "user_email": "amit.joshi@email.com",
                "user_phone": "+919876543216",
                "user_name": "Amit Joshi",
                "date": day_after,
                "time": "13:00",
                "guests": 8,
                "status": "confirmed",
                "special_requests": "Team lunch - need projector setup",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
            # Next week
            {
                "id": str(uuid.uuid4()),
                "table_id": "t4",
                "table_number": 4,
                "user_id": None,
                "user_email": "neha.gupta@email.com",
                "user_phone": "+919876543217",
                "user_name": "Neha Gupta",
                "date": next_week,
                "time": "15:00",
                "guests": 2,
                "status": "confirmed",
                "special_requests": "Quiet corner please",
                "created_at": datetime.now().isoformat(),
                "confirmed_at": datetime.now().isoformat()
            },
        ]
        
        await db.reservations.insert_many(sample_reservations)
        print(f"✅ {len(sample_reservations)} sample reservations created")
        print(f"   - Today ({today}): 4 reservations")
        print(f"   - Tomorrow ({tomorrow}): 2 reservations")
        print(f"   - {day_after}: 1 reservation")
        print(f"   - {next_week}: 1 reservation")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📝 Test Credentials:")
    print("Admin: admin@lumiere.com / admin123")
    print("Customer: customer@example.com / customer123")

if __name__ == "__main__":
    asyncio.run(seed_data())
