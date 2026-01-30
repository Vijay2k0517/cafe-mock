import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def clear_menu():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    result = await db.menu_items.delete_many({})
    print(f"Deleted {result.deleted_count} menu items")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_menu())
