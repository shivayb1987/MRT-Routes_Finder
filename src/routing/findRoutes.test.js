import findRoutes from './findRoutes';

it('should go from origin to destination', () => {
	const results = findRoutes({ lat: 1.322522, lng: 103.815403 }, { lat: 1.29321, lng: 103.852216 });
	const steps = results[0].steps;
	expect(steps[0].from).toBe('origin');
	expect(steps[steps.length - 1].to).toBe('destination');
});
