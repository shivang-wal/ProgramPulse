import requests
import sys
import json
from datetime import datetime

class ProgramManagementAPITester:
    def __init__(self, base_url="https://project-tracker-175.preview.emergentagent.com"):
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
        
        # Test DELETE non-existent event
        success, response = self.run_test(
            "Delete Non-existent Event",
            "DELETE",
            "events/non-existent-id",
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
    print(f"Testing against: https://project-tracker-175.preview.emergentagent.com/api")
    
    tester = ProgramManagementAPITester()
    
    # Run all test suites
    test_suites = [
        ("Project CRUD Operations", tester.test_projects_crud),
        ("Calendar Events CRUD Operations", tester.test_events_crud),
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