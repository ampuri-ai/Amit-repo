import unittest
from Class1 import Student


class TestStudent(unittest.TestCase):

    def test_initial_name(self):
        s = Student("Anna", "A")
        self.assertEqual(s.name, "Anna")

    def test_initial_grade(self):
        s = Student("Anna", "A")
        self.assertEqual(s.grade, "A")

    def test_grade_update(self):
        s = Student("Anna", "A")
        s.grade = "A+"
        self.assertEqual(s.grade, "A+")

    def test_different_student(self):
        s = Student("Bob", "B")
        self.assertEqual(s.name, "Bob")
        self.assertEqual(s.grade, "B")

    def test_name_update(self):
        s = Student("Anna", "A")
        s.name = "Anna Smith"
        self.assertEqual(s.name, "Anna Smith")


if __name__ == "__main__":
    unittest.main()
