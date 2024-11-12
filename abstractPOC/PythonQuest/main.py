import sys
import random
import time
import threading
from abc import ABC, abstractmethod
from collections import deque
from contextlib import contextmanager
from functools import wraps


# Decorators
def coroutine(func):
    @wraps(func)
    def primer(*args, **kwargs):
        gen = func(*args, **kwargs)
        next(gen)
        return gen

    return primer


def logger(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"[LOG] Calling {func.__name__} with args {args} kwargs {kwargs}")
        return func(*args, **kwargs)

    return wrapper


# Context Manager
@contextmanager
def opening(file, mode):
    f = open(file, mode)
    try:
        yield f
    finally:
        f.close()


# Custom Exception
class GameError(Exception):
    pass


# Base Class
class GameEntity(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def describe(self):
        pass


# Player Class
class Player(GameEntity):
    def __init__(self, name):
        super().__init__(name)
        self.inventory = []
        self.health = 100
        self.strength = 10
        self.location = None

    def describe(self):
        return f"Player {self.name} is at {self.location.name}"

    @logger
    def move(self, direction):
        if direction in self.location.connections:
            self.location = self.location.connections[direction]
            print(f"You move to {self.location.name}")
        else:
            print("You can't go that way.")

    def pick_up(self, item):
        self.inventory.append(item)
        print(f"You picked up {item.name}")

    def use_item(self, item_name):
        for item in self.inventory:
            if item.name.lower() == item_name:
                try:
                    item.use(self)
                except Exception as e:
                    raise GameError(f"Cannot use {item_name}: {e}")
                return
        print(f"You don't have {item_name}")


# Item Classes
class Item(GameEntity):
    def __init__(self, name, description):
        super().__init__(name)
        self.description = description

    def describe(self):
        return self.description

    def use(self, player):
        print(f"You use {self.name}")


class HealthPotion(Item):
    def __init__(self):
        super().__init__("Health Potion", "A potion that restores health.")

    def use(self, player):
        player.health = min(100, player.health + 50)
        player.inventory.remove(self)
        print("You feel rejuvenated!")


class Spell(Item):
    def __init__(self, name, description, effect):
        super().__init__(name, description)
        self.effect = effect

    def use(self, player):
        print(f"You cast {self.name}")
        self.effect(player)
        player.inventory.remove(self)


# Room Class
class Room(GameEntity):
    def __init__(self, name):
        super().__init__(name)
        self.description = ""
        self.items = []
        self.connections = {}
        self.monster = None

    def describe(self):
        item_list = (
            ", ".join([item.name for item in self.items]) if self.items else "nothing"
        )
        monster_desc = f"\nYou see a {self.monster.name} here!" if self.monster else ""
        return f"{self.name}: {self.description}\nItems here: {item_list}{monster_desc}"

    def add_item(self, item):
        self.items.append(item)

    def connect(self, room, direction):
        self.connections[direction] = room


# Monster Class
class Monster(GameEntity):
    def __init__(self, name, health):
        super().__init__(name)
        self.health = health
        self.attack_generator = enemy_attack_generator()

    def describe(self):
        return f"A fearsome {self.name} with {self.health} health."

    def attack(self, player):
        damage = next(self.attack_generator)
        player.health -= damage
        print(
            f"The {self.name} attacks you for {damage} damage! Your health is now {player.health}."
        )
        if player.health <= 0:
            print("You have been defeated!")
            sys.exit()


# Generator Function
def enemy_attack_generator():
    while True:
        yield random.randint(5, 15)


# Lambdas for Effects
healing_effect = lambda p: setattr(p, "health", min(100, p.health + 10))
strength_effect = lambda p: setattr(p, "strength", p.strength + 5)


# Game Class
class Game:
    def __init__(self):
        self.player = None
        self.rooms = {}
        self.running = True

    def start(self):
        self.create_world()
        self.player = Player("Hero")
        self.player.location = self.rooms["Entrance"]
        print("Welcome to PythonQuest!")
        autosave_thread = threading.Thread(target=autosave, args=(self,), daemon=True)
        autosave_thread.start()
        self.game_loop()

    def create_world(self):
        entrance = Room("Entrance")
        entrance.description = "You are at the entrance of a dark cave."

        hall = Room("Hall")
        hall.description = "A dimly lit hall with shadows flickering on the walls."

        treasure_room = Room("Treasure Room")
        treasure_room.description = "Glittering gold and jewels are piled high."

        entrance.connect(hall, "north")
        hall.connect(entrance, "south")
        hall.connect(treasure_room, "east")
        treasure_room.connect(hall, "west")

        potion = HealthPotion()
        heal_spell = Spell("Heal", "A spell that heals you.", healing_effect)
        strength_spell = Spell(
            "Strength", "A spell that increases your strength.", strength_effect
        )

        hall.add_item(potion)
        hall.add_item(heal_spell)
        hall.add_item(strength_spell)

        monster = Monster("Goblin", 30)
        hall.monster = monster

        self.rooms = {
            "Entrance": entrance,
            "Hall": hall,
            "Treasure Room": treasure_room,
        }

    def game_loop(self):
        while self.running:
            if self.player.location.monster:
                self.fight_monster(self.player.location.monster)
                continue
            command = input("> ").strip().lower()
            self.process_command(command)

    def process_command(self, command):
        try:
            if command == "quit":
                print("Goodbye!")
                self.running = False
            elif command == "look":
                print(self.player.location.describe())
            elif command.startswith("go "):
                direction = command.split(" ")[1]
                self.player.move(direction)
            elif command.startswith("take "):
                item_name = " ".join(command.split(" ")[1:])
                item = next(
                    (
                        i
                        for i in self.player.location.items
                        if i.name.lower() == item_name
                    ),
                    None,
                )
                if item:
                    self.player.pick_up(item)
                    self.player.location.items.remove(item)
                else:
                    print(f"There is no {item_name} here.")
            elif command.startswith("use "):
                item_name = " ".join(command.split(" ")[1:])
                self.player.use_item(item_name)
            elif command == "inventory":
                if self.player.inventory:
                    print("You have:")
                    for item in self.player.inventory:
                        print(f"- {item.name}")
                else:
                    print("Your inventory is empty.")
            elif command == "save":
                self.save_game()
            elif command == "load":
                self.load_game()
            else:
                print("I don't understand that command.")
        except GameError as ge:
            print(ge)
        except Exception as e:
            print(f"An error occurred: {e}")

    def fight_monster(self, monster):
        print(f"You encounter a {monster.name}!")
        while monster.health > 0 and self.player.health > 0:
            action = input("Do you [attack] or [run]? ").strip().lower()
            if action == "attack":
                damage = random.randint(10, 20)
                monster.health -= damage
                print(
                    f"You attack the {monster.name} for {damage} damage! Its health is now {monster.health}."
                )
                if monster.health <= 0:
                    print(f"You have defeated the {monster.name}!")
                    self.player.location.monster = None
                    break
                else:
                    monster.attack(self.player)
            elif action == "run":
                print("You run away!")
                self.player.move("south")
                break
            else:
                print("Invalid action.")

    def save_game(self, filename="savegame.dat"):
        with opening(filename, "w") as f:
            data = {
                "player": {
                    "name": self.player.name,
                    "health": self.player.health,
                    "strength": self.player.strength,
                    "location": self.player.location.name,
                    "inventory": [item.name for item in self.player.inventory],
                }
            }
            f.write(str(data))
            print("Game saved.")

    def load_game(self, filename="savegame.dat"):
        try:
            with opening(filename, "r") as f:
                data = eval(f.read())
                self.player.name = data["player"]["name"]
                self.player.health = data["player"]["health"]
                self.player.strength = data["player"]["strength"]
                self.player.location = self.rooms[data["player"]["location"]]
                # Reconstruct inventory
                item_map = {
                    "Health Potion": HealthPotion(),
                    "Heal": Spell("Heal", "A spell that heals you.", healing_effect),
                    "Strength": Spell(
                        "Strength",
                        "A spell that increases your strength.",
                        strength_effect,
                    ),
                }
                self.player.inventory = [
                    item_map[name] for name in data["player"]["inventory"]
                ]
                print("Game loaded.")
        except FileNotFoundError:
            print("No saved game found.")


# Autosave Function for Threading
def autosave(game):
    while game.running:
        time.sleep(30)
        game.save_game("autosave.dat")
        print("Game autosaved.")


if __name__ == "__main__":
    game = Game()
    game.start()
