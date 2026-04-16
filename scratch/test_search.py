import requests

def test_search():
    url = "http://localhost:8000/api/chatbot/search/venues?city=Bangalore&sport=Swimming"
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_search()
