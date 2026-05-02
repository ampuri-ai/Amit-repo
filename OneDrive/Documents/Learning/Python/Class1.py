class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade
s1 = Student("Anna", "A")
print(s1.name)  # Output: Anna
print(s1.grade) # Output: A
s1.grade = "A+"
print(s1.grade) # Output: A+