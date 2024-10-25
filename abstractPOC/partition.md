<|im_start|>user
you are a python code partitioning expert. Your job is to convert the above json into a more useful format.

your output type must match the following:

```ts
type output = {
  groupID: number;
  label: string;
  idRange: [number, number];
  children: output[];
}[];
```

<|im_end|>
<|im_start|>assistant
OK
<|im_end|>
<|im_start|>user

```json
[
  {
    "id": 0,
    "code": "# Simple Snake Game in Python 3 for Beginners",
    "children": []
  },
  {
    "id": 1,
    "code": "# By @TokyoEdTech",
    "children": []
  },
  {
    "id": 2,
    "code": "import turtle",
    "children": []
  },
  {
    "id": 3,
    "code": "import time",
    "children": []
  },
  {
    "id": 4,
    "code": "import random",
    "children": []
  },
  {
    "id": 5,
    "code": "delay = 0.1",
    "children": []
  },
  {
    "id": 6,
    "code": "# Score",
    "children": []
  },
  {
    "id": 7,
    "code": "score = 0",
    "children": []
  },
  {
    "id": 8,
    "code": "high_score = 0",
    "children": []
  },
  {
    "id": 9,
    "code": "# Create the Window",
    "children": []
  },
  {
    "id": 10,
    "code": "wn = turtle.Screen()",
    "children": []
  },
  {
    "id": 11,
    "code": "wn.title(\"Snake Game by @TokyoEdTech\")",
    "children": []
  },
  {
    "id": 12,
    "code": "wn.bgcolor(\"green\")",
    "children": []
  },
  {
    "id": 13,
    "code": "wn.setup(width=600, height=600)",
    "children": []
  },
  {
    "id": 14,
    "code": "wn.tracer(0)  # Turns off the screen updates",
    "children": []
  },
  {
    "id": 15,
    "code": "# Draw the snake's head at 0,0",
    "children": []
  },
  {
    "id": 16,
    "code": "head = turtle.Turtle()",
    "children": []
  },
  {
    "id": 17,
    "code": "head.speed(0)",
    "children": []
  },
  {
    "id": 18,
    "code": "head.shape(\"square\")",
    "children": []
  },
  {
    "id": 19,
    "code": "head.color(\"black\")",
    "children": []
  },
  {
    "id": 20,
    "code": "head.penup()",
    "children": []
  },
  {
    "id": 21,
    "code": "head.goto(0, 0)",
    "children": []
  },
  {
    "id": 22,
    "code": "head.direction = \"stop\"",
    "children": []
  },
  {
    "id": 23,
    "code": "# Draw the food at 0, 100",
    "children": []
  },
  {
    "id": 24,
    "code": "food = turtle.Turtle()",
    "children": []
  },
  {
    "id": 25,
    "code": "food.speed(0)",
    "children": []
  },
  {
    "id": 26,
    "code": "food.shape(\"circle\")",
    "children": []
  },
  {
    "id": 27,
    "code": "food.color(\"red\")",
    "children": []
  },
  {
    "id": 28,
    "code": "food.penup()",
    "children": []
  },
  {
    "id": 29,
    "code": "food.goto(0, 100)",
    "children": []
  },
  {
    "id": 30,
    "code": "segments = []",
    "children": []
  },
  {
    "id": 31,
    "code": "# Pen",
    "children": []
  },
  {
    "id": 32,
    "code": "pen = turtle.Turtle()",
    "children": []
  },
  {
    "id": 33,
    "code": "pen.speed(0)",
    "children": []
  },
  {
    "id": 34,
    "code": "pen.shape(\"square\")",
    "children": []
  },
  {
    "id": 35,
    "code": "pen.color(\"white\")",
    "children": []
  },
  {
    "id": 36,
    "code": "pen.penup()",
    "children": []
  },
  {
    "id": 37,
    "code": "pen.hideturtle()",
    "children": []
  },
  {
    "id": 38,
    "code": "pen.goto(0, 260)",
    "children": []
  },
  {
    "id": 39,
    "code": "pen.write(\n\t\"Score: 0  High Score: 0\",\n\tfont=(\"Courier\", 24, \"normal\"),\n)",
    "children": []
  },
  {
    "id": 40,
    "code": "# Functions",
    "children": []
  },
  {
    "id": 41,
    "code": "def go_up():\n\tif head.direction != \"down\":\n\t\thead.direction = \"up\"",
    "children": []
  },
  {
    "id": 42,
    "code": "def go_down():\n\tif head.direction != \"up\":\n\t\thead.direction = \"down\"",
    "children": []
  },
  {
    "id": 43,
    "code": "def go_left():\n\tif head.direction != \"right\":\n\t\thead.direction = \"left\"",
    "children": []
  },
  {
    "id": 44,
    "code": "def go_right():\n\tif head.direction != \"left\":\n\t\thead.direction = \"right\"",
    "children": []
  },
  {
    "id": 45,
    "code": "def move():\n\tif head.direction == \"up\":\n\t\ty = head.ycor()\n\t\thead.sety(y + 20)\n\n\tif head.direction == \"down\":\n\t\ty = head.ycor()\n\t\thead.sety(y - 20)\n\n\tif head.direction == \"left\":\n\t\tx = head.xcor()\n\t\thead.setx(x - 20)\n\n\tif head.direction == \"right\":\n\t\tx = head.xcor()\n\t\thead.setx(x + 20)",
    "children": []
  },
  {
    "id": 46,
    "code": "# Initialize keyboard bindings",
    "children": []
  },
  {
    "id": 47,
    "code": "wn.listen()",
    "children": []
  },
  {
    "id": 48,
    "code": "wn.onkeypress(go_up, \"w\")",
    "children": []
  },
  {
    "id": 49,
    "code": "wn.onkeypress(go_down, \"s\")",
    "children": []
  },
  {
    "id": 50,
    "code": "wn.onkeypress(go_left, \"a\")",
    "children": []
  },
  {
    "id": 51,
    "code": "wn.onkeypress(go_right, \"d\")",
    "children": []
  },
  {
    "id": 52,
    "code": "# Main game loop",
    "children": []
  },
  {
    "id": 53,
    "code": "while True:\n\twn.update()\n\n\t# Check for a collision with the border\n\tif (\n\t\thead.xcor() > 290\n\t\tor head.xcor() < -290\n\t\tor head.ycor() > 290\n\t\tor head.ycor() < -290\n\t):\n\t\ttime.sleep(1)\n\t\thead.goto(0, 0)\n\t\thead.direction = \"stop\"\n\n\t\t# Hide the segments\n\t\tfor segment in segments:\n\t\t\tsegment.goto(1000, 1000)\n\n\t\t# Clear the segments list\n\t\tsegments.clear()\n\n\t\t# Reset the score\n\t\tscore = 0\n\n\t\t# Reset the delay\n\t\tdelay = 0.1\n\n\t\tpen.clear()\n\t\tpen.write(\n\t\t\t\"Score: {}  High Score: {}\".format(score, high_score),\n\t\t\talign=\"center\",\n\t\t\tfont=(\"Courier\", 24, \"normal\"),\n\t\t)\n\n\t# Check for a collision with the food\n\tif head.distance(food) < 20:\n\t\t# Move the food to a random spot\n\t\tx = random.randint(-290, 290)\n\t\ty = random.randint(-290, 290)\n\t\tfood.goto(x, y)\n\n\t\t# Add a segment\n\t\tnew_segment = turtle.Turtle()\n\t\tnew_segment.speed(0)\n\t\tnew_segment.shape(\"square\")\n\t\tnew_segment.color(\"grey\")\n\t\tnew_segment.penup()\n\t\tsegments.append(new_segment)\n\n\t\t# Shorten the delay\n\t\tdelay -= 0.001\n\n\t\t# Increase the score\n\t\tscore += 10\n\n\t\tif score > high_score:\n\t\t\thigh_score = score\n\n\t\tpen.clear()\n\t\tpen.write(\n\t\t\t\"Score: {}  High Score: {}\".format(score, high_score),\n\t\t\talign=\"center\",\n\t\t\tfont=(\"Courier\", 24, \"normal\"),\n\t\t)\n\n\t# Move the end segments first in reverse order\n\tfor index in range(len(segments) - 1, 0, -1):\n\t\tx = segments[index - 1].xcor()\n\t\ty = segments[index - 1].ycor()\n\t\tsegments[index].goto(x, y)\n\n\t# Move segment 0 to where the head is\n\tif len(segments) > 0:\n\t\tx = head.xcor()\n\t\ty = head.ycor()\n\t\tsegments[0].goto(x, y)\n\n\tmove()\n\n\t# Check for head collision with the body segments\n\tfor segment in segments:\n\t\tif segment.distance(head) < 20:\n\t\t\ttime.sleep(1)\n\t\t\thead.goto(0, 0)\n\t\t\thead.direction = \"stop\"\n\n\t\t\t# Hide the segments\n\t\t\tfor segment in segments:\n\t\t\t\tsegment.goto(1000, 1000)\n\n\t\t\t# Clear the segments list\n\t\t\tsegments.clear()\n\n\t\t\t# Reset the score\n\t\t\tscore = 0\n\n\t\t\t# Reset the delay\n\t\t\tdelay = 0.1\n\n\t\t\t# Update the score display\n\t\t\tpen.clear()\n\t\t\tpen.write(\n\t\t\t\t\"Score: {}  High Score: {}\".format(score, high_score),\n\t\t\t\talign=\"center\",\n\t\t\t\tfont=(\"Courier\", 24, \"normal\"),\n\t\t\t)\n\n\ttime.sleep(delay)",
    "children": []
  }
]
```

<|im_end|>
