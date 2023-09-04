// Logs

"use strict";

export class Log {
    public static LOG_INFO = process.env.LOG_INFO !== "NO";
    public static LOG_DEBUG = process.env.LOG_DEBUG === "YES";
    public static LOG_TRACE = process.env.LOG_TRACE === "YES";

    public static log(str: string) {
        const date = new Date();
        console.log(`[${date.toISOString()}] ${str}`);
    }

    public static error(err: string | Error) {
        if (err instanceof Error) {
            console.error(err);
            Log.log(`[ERROR] ${err.message}`);
        } else {
            Log.log(`[ERROR] ${err}`);
        }
    }

    public static warning(str: string) {
        Log.log(`[WARNING] ${str}`);
    }

    public static info(str: string) {
        if (!Log.LOG_INFO) {
            return;
        }
        Log.log(`[INFO] ${str}`);
    }

    public static debug(str: string) {
        if (!Log.LOG_DEBUG) {
            return;
        }
        Log.log(`[DEBUG] ${str}`);
    }

    public static trace(str: string) {
        if (!Log.LOG_TRACE) {
            return;
        }
        Log.log(`[TRACE] ${str}`);
    }
}
