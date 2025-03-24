export async function add(a: number, b: number): Promise<number> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(a + b);
		}, 1000);
	});
}

await add(1, 2);
