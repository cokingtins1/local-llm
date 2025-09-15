import { seedDatabase } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import React from "react";

export default function page() {
	return (
		<form
			action={async () => {
				"use server";

				try {
					await seedDatabase("test_session");

					console.log("Seeding completed successfully.");
				} catch (error) {
					console.error("Seeding failed:", error);
					process.exit(1);
				}
			}}
		>
			<Button>Seed DB</Button>
		</form>
	);
}
