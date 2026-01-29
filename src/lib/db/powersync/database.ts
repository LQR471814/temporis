// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

/**
 * PowerSync Database Initialization
 *
 * Sets up the PowerSyncDatabase instance that handles:
 * - Local SQLite storage for offline-first functionality
 * - Sync with the PowerSync service
 * - Authentication via Supabase JWT
 */

import {
	PowerSyncDatabase,
	type AbstractPowerSyncDatabase,
} from "@powersync/web";
import { AppSchema } from "./schema";
import { supabase } from "../../supabase";

/**
 * PowerSync connection configuration
 */
const POWERSYNC_URL =
	import.meta.env.VITE_POWERSYNC_URL ?? "http://localhost:8081";

/**
 * Supabase connector for PowerSync authentication
 *
 * Provides JWT tokens from the current Supabase session to authenticate
 * with the PowerSync service.
 */
class SupabaseConnector {
	async fetchCredentials() {
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			throw new Error("No active Supabase session");
		}

		return {
			endpoint: POWERSYNC_URL,
			token: session.access_token,
			// Token expiry in seconds
			expiresAt: session.expires_at
				? new Date(session.expires_at * 1000)
				: undefined,
		};
	}

	async uploadData(database: AbstractPowerSyncDatabase) {
		// Handle uploading local changes to the backend
		// This is called when there are pending local changes to sync
		const transaction = await database.getNextCrudTransaction();
		if (!transaction) return;

		try {
			for (const op of transaction.crud) {
				const table = op.table;
				const data = op.opData;

				switch (op.op) {
					case "PUT": {
						// Insert or update
						const { error } = await supabase.from(table as any).upsert({
							id: op.id,
							...data,
						});
						if (error) throw error;
						break;
					}
					case "PATCH": {
						// Update
						const { error } = await supabase
							.from(table as any)
							.update(data)
							.eq("id", op.id);
						if (error) throw error;
						break;
					}
					case "DELETE": {
						// Delete
						const { error } = await supabase
							.from(table as any)
							.delete()
							.eq("id", op.id);
						if (error) throw error;
						break;
					}
				}
			}

			await transaction.complete();
		} catch (error) {
			console.error("Failed to upload data:", error);
			throw error;
		}
	}
}

/**
 * Singleton PowerSync database instance
 */
let powerSyncDb: PowerSyncDatabase | null = null;

/**
 * Get or create the PowerSync database instance
 */
export function getPowerSyncDatabase(): PowerSyncDatabase {
	if (!powerSyncDb) {
		powerSyncDb = new PowerSyncDatabase({
			database: {
				dbFilename: "temporis.sqlite",
			},
			schema: AppSchema,
		});
	}
	return powerSyncDb;
}

/**
 * Initialize PowerSync and connect to the sync service
 *
 * Call this after the user has authenticated with Supabase
 */
export async function initializePowerSync(): Promise<PowerSyncDatabase> {
	const db = getPowerSyncDatabase();
	const connector = new SupabaseConnector();

	// Connect to PowerSync service
	await db.connect(connector);

	// Listen for auth state changes to reconnect
	supabase.auth.onAuthStateChange(async (event, session) => {
		if (event === "SIGNED_IN" && session) {
			await db.connect(connector);
		} else if (event === "SIGNED_OUT") {
			await db.disconnect();
		}
	});

	return db;
}

/**
 * Disconnect from PowerSync
 */
export async function disconnectPowerSync(): Promise<void> {
	if (powerSyncDb) {
		await powerSyncDb.disconnect();
	}
}

export { powerSyncDb };
