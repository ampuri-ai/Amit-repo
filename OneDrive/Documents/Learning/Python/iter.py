numbers = range(1, 1000000)
evens = (x for x in numbers if x % 2 == 0)
squares = (x**2 for x in evens)

filtered_squares = (x for x in squares if x <1000)

print(list(filtered_squares))