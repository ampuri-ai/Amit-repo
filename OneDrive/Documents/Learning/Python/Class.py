class Greeter(object):
    def __init__(self, name):
        self.name = name
        print("Greeter created for " + self.name)
    def hello(self):
        print("Hello, " + self.name + "!")
    def goodbye(self):
        print("Goodbye, " + self.name + "!")

g = Greeter("Amit")
g.hello()
g.goodbye()

g2 = Greeter("Sumit")
g2.hello()
g2.goodbye()
