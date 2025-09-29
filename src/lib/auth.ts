import { getServerSession } from "next-auth";

import { authOptions } from "./authOptions";

export const getCurrentUserSession = () => getServerSession(authOptions);
export { authOptions };
