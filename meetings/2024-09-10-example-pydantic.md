# Case Study - Pydantic

One of pydantic's primary features is to serialize data from json to python. For the most part, it has excellent user documentation on nearly every topic. However, documentation on creating schemas to hold the data is non-existent except for the API docs found at https://docs.pydantic.dev/latest/api/pydantic_core_schema/.

The struggle from lack of documentation is the hidden "black-box" nature of pydantic. It is difficult to see where or how any of these functions are used internally. We only know that they are exposed here as an interface to the inner workings of pydantic's object representation mechanism.

A graph based visualizer of the codebase would significantly reduce the struggle of finding out exactly what these functions do, with no additional cost to the developer. At a bare minimum, it provides a starting point for users and new contributors to find closely related functions, thereby giving them a path to start formulating a mental model of the library.

For example, the schema functions named <primitive_type>\_schema like bool, int, or str are actually what pydantic uses when you define class attributes with primitive_type type hints: https://docs.pydantic.dev/latest/#pydantic-examples. Seeing where/how these functions are called can help users make decisions on how they want to use the provided schema functions.
