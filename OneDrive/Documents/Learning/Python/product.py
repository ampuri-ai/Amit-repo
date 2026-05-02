class Product:
    def __init__(self, name, cost, price):
        self.name = name
        self.cost = cost
        self.price = price
    def profit_margin(self):
        return self.price - self.cost
p1 = Product("Widget", 25, 19.99)
print(p1.name)
print(p1.cost)
print(p1.price)
print(p1.profit_margin())
print(p1)