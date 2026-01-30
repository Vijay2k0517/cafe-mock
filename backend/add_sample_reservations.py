import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid

load_dotenv('.env')
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

async def check_and_add():
    # Check existing reservations
    reservations = await db.reservations.find().to_list(20)
    print(f"Found {len(reservations)} reservations:")
    for r in reservations:
        print(f"  - Date: {r.get('date')}, Status: {r.get('status')}, Name: {r.get('user_name')}, Table: {r.get('table_number')}")
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Check if any today reservations exist
    todays = [r for r in reservations if r.get('date') == today and r.get('status') == 'confirmed']
    print(f"\nToday's ({today}) confirmed reservations: {len(todays)}")
    
    if len(todays) == 0:
        print("\nAdding sample reservations for today...")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        day_after = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
        
        new_reservations = [
            {
                'id': str(uuid.uuid4()),
                'table_id': 't1',
                'table_number': 1,
                'user_phone': '+919876543210',
                'user_name': 'Priya Sharma',
                'date': today,
                'time': '09:00',
                'guests': 2,
                'status': 'confirmed',
                'special_requests': 'Window seat preferred',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'table_id': 't5',
                'table_number': 5,
                'user_phone': '+919876543211',
                'user_name': 'Rahul Kumar',
                'date': today,
                'time': '10:30',
                'guests': 4,
                'status': 'confirmed',
                'special_requests': 'Birthday celebration',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'table_id': 't3',
                'table_number': 3,
                'user_phone': '+919876543212',
                'user_name': 'Meera Patel',
                'date': today,
                'time': '12:00',
                'guests': 2,
                'status': 'confirmed',
                'special_requests': '',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'table_id': 't9',
                'table_number': 9,
                'user_phone': '+919876543213',
                'user_name': 'Vijay Singh',
                'date': today,
                'time': '14:00',
                'guests': 6,
                'status': 'confirmed',
                'special_requests': 'Business meeting',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            # Tomorrow
            {
                'id': str(uuid.uuid4()),
                'table_id': 't2',
                'table_number': 2,
                'user_phone': '+919876543214',
                'user_name': 'Anita Desai',
                'date': tomorrow,
                'time': '08:00',
                'guests': 2,
                'status': 'confirmed',
                'special_requests': 'Anniversary celebration',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'table_id': 't6',
                'table_number': 6,
                'user_phone': '+919876543215',
                'user_name': 'Kiran Reddy',
                'date': tomorrow,
                'time': '11:00',
                'guests': 4,
                'status': 'confirmed',
                'special_requests': 'Vegetarian only',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
            # Day after
            {
                'id': str(uuid.uuid4()),
                'table_id': 't11',
                'table_number': 11,
                'user_phone': '+919876543216',
                'user_name': 'Amit Joshi',
                'date': day_after,
                'time': '13:00',
                'guests': 8,
                'status': 'confirmed',
                'special_requests': 'Team lunch',
                'created_at': datetime.now().isoformat(),
                'confirmed_at': datetime.now().isoformat()
            },
        ]
        
        await db.reservations.insert_many(new_reservations)
        print(f"Added {len(new_reservations)} sample reservations!")
    
    client.close()

asyncio.run(check_and_add())
