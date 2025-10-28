import requests
import sys
import json
from datetime import datetime

class ProgramManagementAPITester:
    def __init__(self, base_url="https://project-tracker-178.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_project_id = None
        self.created_event_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'GET' and isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items returned")
                    elif 'id' in str(response_data):
                        print(f"   Response contains ID field")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_projects_crud(self):
        """Test complete CRUD operations for projects"""
        print("\n" + "="*50)
        print("TESTING PROJECT CRUD OPERATIONS")
        print("="*50)
        
        # Test GET empty projects list
        success, response = self.run_test(
            "Get Projects (Empty)",
            "GET",
            "projects",
            200
        )
        if not success:
            return False

        # Test CREATE project
        project_data = {
            "name": "Test Project Alpha",
            "status": "On Track",
            "completedThisWeek": "Implemented user authentication and basic UI components",
            "risks": "Potential delay in third-party API integration",
            "escalation": "Need approval for additional resources",
            "plannedNextWeek": "Complete API integration and testing",
            "bugsCount": 3
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        if success and 'id' in response:
            self.created_project_id = response['id']
            print(f"   Created project ID: {self.created_project_id}")
        else:
            return False

        # Test GET projects list (should have 1 project)
        success, response = self.run_test(
            "Get Projects (With Data)",
            "GET",
            "projects",
            200
        )
        if not success or len(response) != 1:
            print(f"❌ Expected 1 project, got {len(response) if success else 0}")
            return False

        # Test GET single project
        success, response = self.run_test(
            "Get Single Project",
            "GET",
            f"projects/{self.created_project_id}",
            200
        )
        if not success:
            return False

        # Test UPDATE project
        update_data = {
            "status": "At Risk",
            "bugsCount": 5,
            "risks": "Updated risk: Database performance issues identified"
        }
        
        success, response = self.run_test(
            "Update Project",
            "PUT",
            f"projects/{self.created_project_id}",
            200,
            data=update_data
        )
        if not success:
            return False

        # Verify update worked
        success, response = self.run_test(
            "Verify Project Update",
            "GET",
            f"projects/{self.created_project_id}",
            200
        )
        if success:
            if response.get('status') == 'At Risk' and response.get('bugsCount') == 5:
                print("✅ Project update verified successfully")
            else:
                print(f"❌ Update verification failed - Status: {response.get('status')}, Bugs: {response.get('bugsCount')}")
                return False

        return True

    def test_events_crud(self):
        """Test complete CRUD operations for calendar events"""
        print("\n" + "="*50)
        print("TESTING CALENDAR EVENTS CRUD OPERATIONS")
        print("="*50)
        
        # Test GET empty events list
        success, response = self.run_test(
            "Get Events (Empty)",
            "GET",
            "events",
            200
        )
        if not success:
            return False

        # Test CREATE event
        event_data = {
            "date": "2024-12-25",
            "title": "Release v2.0",
            "description": "Major release with new features and bug fixes",
            "projectId": self.created_project_id
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=event_data
        )
        if success and 'id' in response:
            self.created_event_id = response['id']
            print(f"   Created event ID: {self.created_event_id}")
        else:
            return False

        # Test GET events list (should have 1 event)
        success, response = self.run_test(
            "Get Events (With Data)",
            "GET",
            "events",
            200
        )
        if not success or len(response) != 1:
            print(f"❌ Expected 1 event, got {len(response) if success else 0}")
            return False

        return True

    def test_calendar_event_delete_functionality(self):
        """Test comprehensive calendar event delete functionality as requested"""
        print("\n" + "="*50)
        print("TESTING CALENDAR EVENT DELETE FUNCTIONALITY")
        print("="*50)
        
        # 1. Delete Calendar Event - Success Case
        print("\n🔍 Test 1: Delete Calendar Event - Success Case")
        
        # First, create a test event
        event_data = {
            "date": "2024-12-20",
            "startTime": "14:00",
            "endTime": "15:00",
            "title": "Sprint Planning Meeting",
            "description": "Planning session for next sprint",
            "category": "Meeting",
            "color": "#ff6b6b"
        }
        
        success, response = self.run_test(
            "Create Event for Delete Test",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if not success or 'id' not in response:
            print("❌ Failed to create event for delete test")
            return False
            
        test_event_id = response['id']
        print(f"   Created test event ID: {test_event_id}")
        
        # Delete the event
        success, response = self.run_test(
            "Delete Event (Success Case)",
            "DELETE",
            f"events/{test_event_id}",
            200
        )
        
        if not success:
            return False
            
        # Verify the response message
        if response.get('message') != 'Event deleted successfully':
            print(f"❌ Expected 'Event deleted successfully', got: {response.get('message')}")
            return False
        else:
            print("✅ Delete response message verified")
        
        # Verify the event is actually deleted by fetching all events
        success, all_events = self.run_test(
            "Verify Event Deleted (Fetch All)",
            "GET",
            "events",
            200
        )
        
        if not success:
            return False
            
        # Check that our deleted event is not in the list
        deleted_event_found = any(event.get('id') == test_event_id for event in all_events)
        if deleted_event_found:
            print(f"❌ Deleted event {test_event_id} still found in events list")
            return False
        else:
            print("✅ Event successfully removed from database")
        
        # 2. Delete Calendar Event - Error Case
        print("\n🔍 Test 2: Delete Calendar Event - Error Case")
        
        # Try to delete a non-existent event with a random UUID
        import uuid
        random_uuid = str(uuid.uuid4())
        
        success, response = self.run_test(
            "Delete Non-existent Event",
            "DELETE",
            f"events/{random_uuid}",
            404
        )
        
        if not success:
            return False
            
        # Verify error message
        if 'Event not found' not in str(response.get('detail', '')):
            print(f"❌ Expected 'Event not found' in error, got: {response}")
            return False
        else:
            print("✅ Error message verified for non-existent event")
        
        # 3. Integration Test - Multiple Events
        print("\n🔍 Test 3: Integration Test - Multiple Events")
        
        # Create multiple events
        events_data = [
            {
                "date": "2024-12-21",
                "startTime": "09:00",
                "endTime": "10:00",
                "title": "Daily Standup",
                "description": "Team sync meeting",
                "category": "Meeting",
                "color": "#4ecdc4"
            },
            {
                "date": "2024-12-21",
                "startTime": "11:00",
                "endTime": "12:00",
                "title": "Code Review Session",
                "description": "Review pull requests",
                "category": "Development",
                "color": "#45b7d1"
            },
            {
                "date": "2024-12-22",
                "startTime": "15:00",
                "endTime": "16:00",
                "title": "Client Demo",
                "description": "Showcase new features",
                "category": "Demo",
                "color": "#96ceb4"
            }
        ]
        
        created_event_ids = []
        
        # Create all events
        for i, event_data in enumerate(events_data):
            success, response = self.run_test(
                f"Create Event {i+1} for Integration Test",
                "POST",
                "events",
                200,
                data=event_data
            )
            
            if not success or 'id' not in response:
                print(f"❌ Failed to create event {i+1}")
                return False
                
            created_event_ids.append(response['id'])
            print(f"   Created event {i+1} ID: {response['id']}")
        
        # Verify all events were created
        success, all_events = self.run_test(
            "Verify All Events Created",
            "GET",
            "events",
            200
        )
        
        if not success:
            return False
            
        if len(all_events) < 3:
            print(f"❌ Expected at least 3 events, found {len(all_events)}")
            return False
        
        # Delete the middle event (Code Review Session)
        event_to_delete = created_event_ids[1]
        success, response = self.run_test(
            "Delete Middle Event (Integration Test)",
            "DELETE",
            f"events/{event_to_delete}",
            200
        )
        
        if not success:
            return False
        
        # Verify only that event is deleted and others remain
        success, remaining_events = self.run_test(
            "Verify Selective Deletion",
            "GET",
            "events",
            200
        )
        
        if not success:
            return False
        
        # Check that deleted event is gone
        deleted_event_found = any(event.get('id') == event_to_delete for event in remaining_events)
        if deleted_event_found:
            print(f"❌ Deleted event {event_to_delete} still found")
            return False
        
        # Check that other events still exist
        remaining_ids = [event.get('id') for event in remaining_events]
        expected_remaining = [created_event_ids[0], created_event_ids[2]]
        
        for expected_id in expected_remaining:
            if expected_id not in remaining_ids:
                print(f"❌ Expected event {expected_id} not found in remaining events")
                return False
        
        print("✅ Integration test passed - only selected event deleted, others remain")
        
        # Clean up remaining test events
        for event_id in [created_event_ids[0], created_event_ids[2]]:
            self.run_test(
                f"Cleanup Event {event_id}",
                "DELETE",
                f"events/{event_id}",
                200
            )
        
        return True

    def test_error_cases(self):
        """Test error handling"""
        print("\n" + "="*50)
        print("TESTING ERROR CASES")
        print("="*50)
        
        # Test GET non-existent project
        success, response = self.run_test(
            "Get Non-existent Project",
            "GET",
            "projects/non-existent-id",
            404
        )
        
        # Test UPDATE non-existent project
        success, response = self.run_test(
            "Update Non-existent Project",
            "PUT",
            "projects/non-existent-id",
            404,
            data={"name": "Updated Name"}
        )
        
        # Test DELETE non-existent project
        success, response = self.run_test(
            "Delete Non-existent Project",
            "DELETE",
            "projects/non-existent-id",
            404
        )

        return True

    def test_cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete created event
        if self.created_event_id:
            success, response = self.run_test(
                "Delete Test Event",
                "DELETE",
                f"events/{self.created_event_id}",
                200
            )
        
        # Delete created project
        if self.created_project_id:
            success, response = self.run_test(
                "Delete Test Project",
                "DELETE",
                f"projects/{self.created_project_id}",
                200
            )

        return True

def main():
    print("🚀 Starting Program Management API Tests")
    print(f"Testing against: https://project-tracker-178.preview.emergentagent.com/api")
    
    tester = ProgramManagementAPITester()
    
    # Run all test suites
    test_suites = [
        ("Project CRUD Operations", tester.test_projects_crud),
        ("Calendar Events CRUD Operations", tester.test_events_crud),
        ("Calendar Event Delete Functionality", tester.test_calendar_event_delete_functionality),
        ("Error Handling", tester.test_error_cases),
        ("Cleanup", tester.test_cleanup)
    ]
    
    all_passed = True
    for suite_name, test_func in test_suites:
        print(f"\n🧪 Running {suite_name}...")
        if not test_func():
            print(f"❌ {suite_name} failed!")
            all_passed = False
        else:
            print(f"✅ {suite_name} passed!")

    # Print final results
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if all_passed and tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed successfully!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())