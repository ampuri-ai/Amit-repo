class Dog:
    def __init__(self, name,age):
        self.name = name
        self.age = age

my_dog = Dog("Buddy", 5 )
print(my_dog.name)  # Output: Buddy
print(my_dog.age)   # Output: 5

my_dog.age += 1
print(my_dog.age)   # Output: 6

#Add new properties to the Dog class
my_dog.breed = "Golden Retriever"
print(my_dog.breed)  # Output: Golden Retriever,"john"p