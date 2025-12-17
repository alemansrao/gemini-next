import React from "react";
import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenuToggle,
	NavbarMenu,
	NavbarMenuItem,
	Link,
	Button,
} from "@heroui/react";
import Image from "next/image";
import { warning } from "framer-motion";

export const AcmeLogo = () => {
	return (
		<Image
			src="/gemini.png"
			alt="Gemini Logo"
			width={100}
			height={50}
			priority   // ensures eager loading for LCP images
            loading="eager"
		/>
	);
};

export default function NavbarComponent({ chattitle }) {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const menuItems = [
		{ 'name': 'Chat title blah blah blah blah', 'href': '/settings' },
		// {'name': 'Dashboard', 'href': '/dashboard'},
		// {'name': 'Profile', 'href': '/profile'},
		// {'name': 'Help', 'href': '/help'},
		// {'name': 'Logout', 'href': '/logout'},
	];

	return (
		<Navbar onMenuOpenChange={setIsMenuOpen}>
			<NavbarContent>
				<NavbarMenuToggle
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					className="sm:hidden"
				/>
				<NavbarBrand>
					<Link href="/"><AcmeLogo /></Link>
					{/* <p className="font-bold text-inherit">ACME</p> */}
				</NavbarBrand>
			</NavbarContent>

			<NavbarContent className="hidden sm:flex gap-4" justify="center">
				<NavbarItem>
					{/* <Link color="foreground" href={item.href} key={`${item.name}-${index}`}> */}
					{chattitle}
					{/* </Link> */}
				</NavbarItem>

			</NavbarContent>
			<NavbarContent justify="end">
				{/* <NavbarItem className="hidden lg:flex">
					<Link href="#">Login</Link>
				</NavbarItem> */}
				<NavbarItem>
					<Button as={Link} color="primary" href="/settings" variant="bordered">
						Settings
					</Button>
				</NavbarItem>
			</NavbarContent>
			<NavbarMenu>
				{menuItems.map((item, index) => (
					<NavbarMenuItem key={`${item.name}-${index}`}>
						<Link
							className="w-full"
							color={
								index === 2 ? "primary" : index === menuItems.length - 1 ? "danger" : "foreground"
							}
							href="#"
							size="lg"
						>
							{item.name}
						</Link>
					</NavbarMenuItem>
				))}
			</NavbarMenu>
		</Navbar>
	);
}