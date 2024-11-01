export type Env = {
	ITEM: KVNamespace;
	API_KEY: string;
};

declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
