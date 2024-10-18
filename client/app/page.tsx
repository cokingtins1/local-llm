"use client";
import { Input } from "@/components/ui/input";

import { promptSchema, TPromptSchema } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import main from "./actions/main";

export default function Page() {
	return (
		<div>
			<form action={main}>
				<Button type="submit">Load Document</Button>
			</form>
		</div>
	);
}
