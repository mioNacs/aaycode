import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const authRoutes = ["/login", "/signup", "/login/verify"];
const protectedRoutes = ["/dashboard", "/u"];

export default withAuth(
	function middleware(request) {
		const token = request.nextauth.token;
		const { pathname } = request.nextUrl;

		if (token && authRoutes.some((route) => pathname.startsWith(route))) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl;

				if (authRoutes.some((route) => pathname.startsWith(route))) {
					return true;
				}

				return token ? true : !protectedRoutes.some((route) => pathname.startsWith(route));
			},
		},
	}
);

export const config = {
	matcher: ["/dashboard/:path*", "/u/:path*","/login/:path*", "/signup/:path*"],
};
