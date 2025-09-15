import { Pool } from "pg";

export default async function getChunkIds() {
	const pool = new Pool({
		host: "localhost",
		port: 6024,
		user: "langchain",
		password: "langchain",
		database: "langchain",
	});

	let client;
	let chunkIds: (string | undefined)[] = [];
	try {
		client = await pool.connect();

		const queryRes = await client.query(
			"SELECT DISTINCT metadata->>'chunkId' AS chunkId FROM DocumentContext"
		);

		if (queryRes) {
			chunkIds = queryRes.rows.map((row) => row.chunkid);
		}
	} catch (error) {
		console.error("Error executing the query:", error);
	} finally {
		if (client) {
			client.release();
		}
	}

	return chunkIds;
}
