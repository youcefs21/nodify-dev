You will be given a piece of code. Your task is to abstract this code, replacing specific implementation details with more general descriptions of what the code is doing:


1. Your goal is to create an abstracted version of this code that captures the high-level logic and structure while omitting specific implementation details.

2. To abstract the code:
   a. Keep the overall structure intact.
   b. Replace specific implementation details with general descriptions of what that section of code is doing.
   c. Use the following format to indicate abstracted sections:
      <<< 
      [original code]
      >>> [abstracted description]

3. Guidelines for abstraction:
   - Use clear, concise language in your abstracted descriptions.

4. Provide your abstracted code inside a Python code block, like this:
   ```python
   [Your abstracted code here]
   ```
5. Consider the following example:
<example>
<input>
```python
def get_permutations(s):
    if len(s) == 1:
        return [s]  
    
    permutations = [] 
    
    for i, char in enumerate(s):
        remaining = s[:i] + s[i+1:]
        
        for perm in get_permutations(remaining):
            permutations.append(char + perm)
    
    return permutations
```
</input>

<output>
```python
def get_permutations(s):
    <<<
    if len(s) == 1:
        return [s]  
    >>> exit: length 1 strings have a single permutation
    
    permutations = [] 
    
    <<<
    for i, char in enumerate(s):
    >>> for each character in the string:
        <<<
        remaining = s[:i] + s[i+1:]

        for perm in get_permutations(remaining):
            permutations.append(char + perm)
        >>> recursively search for permutations with that character removed
    
    return permutations
```
</output>
</example>


Now, please abstract the given code according to these instructions:
```
# Main game loop
while True:
    wn.update()

    # Check for a collision with the border
    if (
        head.xcor() > 290
        or head.xcor() < -290
        or head.ycor() > 290
        or head.ycor() < -290
    ):
        time.sleep(1)
        head.goto(0, 0)
        head.direction = "stop"

        # Hide the segments
        for segment in segments:
            segment.goto(1000, 1000)

        # Clear the segments list
        segments.clear()

        # Reset the score
        score = 0

        # Reset the delay
        delay = 0.1

        pen.clear()
        pen.write(
            "Score: {}  High Score: {}".format(score, high_score),
            align="center",
            font=("Courier", 24, "normal"),
        )

    # Check for a collision with the food
    if head.distance(food) < 20:
        # Move the food to a random spot
        x = random.randint(-290, 290)
        y = random.randint(-290, 290)
        food.goto(x, y)

        # Add a segment
        new_segment = turtle.Turtle()
        new_segment.speed(0)
        new_segment.shape("square")
        new_segment.color("grey")
        new_segment.penup()
        segments.append(new_segment)

        # Shorten the delay
        delay -= 0.001

        # Increase the score
        score += 10

        if score > high_score:
            high_score = score

        pen.clear()
        pen.write(
            "Score: {}  High Score: {}".format(score, high_score),
            align="center",
            font=("Courier", 24, "normal"),
        )

    # Move the end segments first in reverse order
    for index in range(len(segments) - 1, 0, -1):
        x = segments[index - 1].xcor()
        y = segments[index - 1].ycor()
        segments[index].goto(x, y)

    # Move segment 0 to where the head is
    if len(segments) > 0:
        x = head.xcor()
        y = head.ycor()
        segments[0].goto(x, y)

    move()

    # Check for head collision with the body segments
    for segment in segments:
        if segment.distance(head) < 20:
            time.sleep(1)
            head.goto(0, 0)
            head.direction = "stop"

            # Hide the segments
            for segment in segments:
                segment.goto(1000, 1000)

            # Clear the segments list
            segments.clear()

            # Reset the score
            score = 0

            # Reset the delay
            delay = 0.1

            # Update the score display
            pen.clear()
            pen.write(
                "Score: {}  High Score: {}".format(score, high_score),
                align="center",
                font=("Courier", 24, "normal"),
            )

    time.sleep(delay)
```