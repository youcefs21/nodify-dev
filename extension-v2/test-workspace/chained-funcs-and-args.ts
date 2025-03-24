import { pipe } from "effect";

function add(a: number) {
	return (b: number) => a + b;
}

function multiply(a: number) {
	return (b: number) => a * b;
}

function divide(a: number) {
	return (b: number) => a / b;
}

function subtract(a: number) {
	return (b: number) => a - b;
}

const result = pipe(5, add(1), multiply(2), divide(2), subtract(1));

console.log(result);
