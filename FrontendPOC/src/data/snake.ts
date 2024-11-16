import type { output } from "../components/nodes.schema";
export const testSnake: output[] = [
	{
		groupID: 0,
		label: "Level 1 Child 1",
		idRange: [11, 20],
		type: "expression",
	},
	{
		groupID: 1,
		label: "Level 1 Child 2",
		idRange: [11, 20],
		type: "function_call",
		children: [
			{
				groupID: 2,
				label: "Level 3 Child 1",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 3,
				label: "Level 3 Child 2",
				idRange: [11, 20],
				type: "function_call",
			},
		],
	},
	{
		groupID: 4,
		label: "Level 1 Child 3",
		idRange: [11, 20],
		type: "expression",
		children: [
			{
				groupID: 5,
				label: "Level 3 Child 3",
				idRange: [11, 20],
				type: "function_call",
			},
		],
	},
	{
		groupID: 6,
		label: "Level 1 Child 4",
		idRange: [11, 20],
		type: "function_call",
	},
];
export const abstractSnake: output[] = [
	{
		groupID: 0,
		label: "Initial Setup",
		idRange: [0, 29],
		type: "expression",
		children: [
			{
				groupID: 1,
				label: "Set delay",
				idRange: [0, 0],
				type: "expression",
			},
			{
				groupID: 2,
				label: "Set score variables",
				idRange: [1, 2],
				type: "expression",
			},
			{
				groupID: 3,
				label: "Setup screen",
				idRange: [3, 7],
				type: "expression",
			},
			{
				groupID: 4,
				label: "Setup head",
				idRange: [8, 14],
				type: "expression",
			},
			{
				groupID: 5,
				label: "Setup food",
				idRange: [15, 20],
				type: "expression",
			},
			{
				groupID: 6,
				label: "Setup segments list",
				idRange: [21, 21],
				type: "expression",
			},
			{
				groupID: 7,
				label: "Setup pen",
				idRange: [22, 29],
				type: "expression",
			},
		],
	},
	{
		groupID: 8,
		label: "Event Handlers Setup",
		idRange: [30, 34],
		type: "event_handler_setup",
	},
	{
		groupID: 9,
		label: "Main Loop",
		idRange: [35, 35],
		type: "loop",
		children: [
			{
				groupID: 10,
				label: "Update screen",
				idRange: [0, 0],
				type: "function_call",
			},
			{
				groupID: 11,
				label: "Check for collision with border",
				idRange: [1, 1],
				type: "conditional",
				children: [
					{
						groupID: 12,
						label: "Collision actions",
						idRange: [0, 8],
						type: "expression",
					},
				],
			},
			{
				groupID: 13,
				label: "Check for collision with food",
				idRange: [2, 2],
				type: "conditional",
				children: [
					{
						groupID: 14,
						label: "Food spawn",
						idRange: [0, 13],
						type: "expression",
					},
				],
			},
			{
				groupID: 15,
				label: "Move segments",
				idRange: [3, 3],
				type: "loop",
				children: [
					{
						groupID: 16,
						label: "Segment movement",
						idRange: [0, 2],
						type: "expression",
					},
				],
			},
			{
				groupID: 17,
				label: "Move head",
				idRange: [4, 4],
				type: "conditional",
				children: [
					{
						groupID: 18,
						label: "Move first segment",
						idRange: [0, 2],
						type: "expression",
					},
				],
			},
			{
				groupID: 19,
				label: "Function call",
				idRange: [5, 5],
				type: "function_call",
			},
			{
				groupID: 20,
				label: "Check for collisions with body",
				idRange: [6, 6],
				type: "loop",
				children: [
					{
						groupID: 21,
						label: "Collision actions",
						idRange: [0, 8],
						type: "conditional",
					},
				],
			},
			{
				groupID: 22,
				label: "Sleep for delay",
				idRange: [7, 7],
				type: "expression",
			},
		],
	},
	{
		groupID: 23,
		label: "Mainloop Call",
		idRange: [36, 36],
		type: "function_call",
	},
];

export const rawSnake = [
	{
		id: 0,
		text: "delay = 0.1",
	},
	{
		id: 1,
		text: "score = 0",
	},
	{
		id: 2,
		text: "high_score = 0",
	},
	{
		id: 3,
		text: "wn = turtle.Screen()",
	},
	{
		id: 4,
		text: 'wn.title("Snake Game by @TokyoEdTech")',
	},
	{
		id: 5,
		text: 'wn.bgcolor("green")',
	},
	{
		id: 6,
		text: "wn.setup(width=600, height=600)",
	},
	{
		id: 7,
		text: "wn.tracer(0)",
	},
	{
		id: 8,
		text: "head = turtle.Turtle()",
	},
	{
		id: 9,
		text: "head.speed(0)",
	},
	{
		id: 10,
		text: 'head.shape("square")',
	},
	{
		id: 11,
		text: 'head.color("black")',
	},
	{
		id: 12,
		text: "head.penup()",
	},
	{
		id: 13,
		text: "head.goto(0, 0)",
	},
	{
		id: 14,
		text: 'head.direction = "stop"',
	},
	{
		id: 15,
		text: "food = turtle.Turtle()",
	},
	{
		id: 16,
		text: "food.speed(0)",
	},
	{
		id: 17,
		text: 'food.shape("circle")',
	},
	{
		id: 18,
		text: 'food.color("red")',
	},
	{
		id: 19,
		text: "food.penup()",
	},
	{
		id: 20,
		text: "food.goto(0, 100)",
	},
	{
		id: 21,
		text: "segments = []",
	},
	{
		id: 22,
		text: "pen = turtle.Turtle()",
	},
	{
		id: 23,
		text: "pen.speed(0)",
	},
	{
		id: 24,
		text: 'pen.shape("square")',
	},
	{
		id: 25,
		text: 'pen.color("white")',
	},
	{
		id: 26,
		text: "pen.penup()",
	},
	{
		id: 27,
		text: "pen.hideturtle()",
	},
	{
		id: 28,
		text: "pen.goto(0, 260)",
	},
	{
		id: 29,
		text: 'pen.write(\n    "Score: 0  High Score: 0",\n    font=("Courier", 24, "normal"),\n)',
	},
	{
		id: 30,
		text: "wn.listen()",
	},
	{
		id: 31,
		text: 'wn.onkeypress(go_up, "w")',
		references: [{ name: "go_up", id: "1" }],
	},
	{
		id: 32,
		text: 'wn.onkeypress(go_down, "s")',
	},
	{
		id: 33,
		text: 'wn.onkeypress(go_left, "a")',
	},
	{
		id: 34,
		text: 'wn.onkeypress(go_right, "d")',
	},
	{
		id: 35,
		text: "while True:\n    <while_body/>",
		children: [
			{
				id: 0,
				text: "wn.update()",
			},
			{
				id: 1,
				text: "if (\n        head.xcor() > 290\n        or head.xcor() < -290\n        or head.ycor() > 290\n        or head.ycor() < -290\n    ):\n        <if_body/>",
				children: [
					{
						id: 0,
						text: "time.sleep(1)",
					},
					{
						id: 1,
						text: "head.goto(0, 0)",
					},
					{
						id: 2,
						text: 'head.direction = "stop"',
					},
					{
						id: 3,
						text: "for segment in segments:\n            <for_body/>",
						children: [
							{
								id: 0,
								text: "segment.goto(1000, 1000)",
							},
						],
					},
					{
						id: 4,
						text: "segments.clear()",
					},
					{
						id: 5,
						text: "score = 0",
					},
					{
						id: 6,
						text: "delay = 0.1",
					},
					{
						id: 7,
						text: "pen.clear()",
					},
					{
						id: 8,
						text: 'pen.write(\n            "Score: {}  High Score: {}".format(score, high_score),\n            align="center",\n            font=("Courier", 24, "normal"),\n        )',
					},
				],
			},
			{
				id: 2,
				text: "if head.distance(food) < 20:\n        # Move the food to a random spot\n        <if_body/>",
				children: [
					{
						id: 0,
						text: "x = random.randint(-290, 290)",
					},
					{
						id: 1,
						text: "y = random.randint(-290, 290)",
					},
					{
						id: 2,
						text: "food.goto(x, y)",
					},
					{
						id: 3,
						text: "new_segment = turtle.Turtle()",
					},
					{
						id: 4,
						text: "new_segment.speed(0)",
					},
					{
						id: 5,
						text: 'new_segment.shape("square")',
					},
					{
						id: 6,
						text: 'new_segment.color("grey")',
					},
					{
						id: 7,
						text: "new_segment.penup()",
					},
					{
						id: 8,
						text: "segments.append(new_segment)",
					},
					{
						id: 9,
						text: "delay -= 0.001",
					},
					{
						id: 10,
						text: "score += 10",
					},
					{
						id: 11,
						text: "if score > high_score:\n            <if_body/>",
						children: [
							{
								id: 0,
								text: "high_score = score",
							},
						],
					},
					{
						id: 12,
						text: "pen.clear()",
					},
					{
						id: 13,
						text: 'pen.write(\n            "Score: {}  High Score: {}".format(score, high_score),\n            align="center",\n            font=("Courier", 24, "normal"),\n        )',
					},
				],
			},
			{
				id: 3,
				text: "for index in range(len(segments) - 1, 0, -1):\n        <for_body/>",
				children: [
					{
						id: 0,
						text: "x = segments[index - 1].xcor()",
					},
					{
						id: 1,
						text: "y = segments[index - 1].ycor()",
					},
					{
						id: 2,
						text: "segments[index].goto(x, y)",
					},
				],
			},
			{
				id: 4,
				text: "if len(segments) > 0:\n        <if_body/>",
				children: [
					{
						id: 0,
						text: "x = head.xcor()",
					},
					{
						id: 1,
						text: "y = head.ycor()",
					},
					{
						id: 2,
						text: "segments[0].goto(x, y)",
					},
				],
			},
			{
				id: 5,
				text: "move()",
			},
			{
				id: 6,
				text: "for segment in segments:\n        <for_body/>",
				children: [
					{
						id: 0,
						text: "if segment.distance(head) < 20:\n            <if_body/>",
						children: [
							{
								id: 0,
								text: "time.sleep(1)",
							},
							{
								id: 1,
								text: "head.goto(0, 0)",
							},
							{
								id: 2,
								text: 'head.direction = "stop"',
							},
							{
								id: 3,
								text: "for segment in segments:\n                <for_body/>",
								children: [
									{
										id: 0,
										text: "segment.goto(1000, 1000)",
									},
								],
							},
							{
								id: 4,
								text: "segments.clear()",
							},
							{
								id: 5,
								text: "score = 0",
							},
							{
								id: 6,
								text: "delay = 0.1",
							},
							{
								id: 7,
								text: "pen.clear()",
							},
							{
								id: 8,
								text: 'pen.write(\n                "Score: {}  High Score: {}".format(score, high_score),\n                align="center",\n                font=("Courier", 24, "normal"),\n            )',
							},
						],
					},
				],
			},
			{
				id: 7,
				text: "time.sleep(delay)",
			},
		],
	},
	{
		id: 36,
		text: "wn.mainloop()",
	},
];
