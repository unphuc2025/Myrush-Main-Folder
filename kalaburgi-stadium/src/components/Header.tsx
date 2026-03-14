import { Link } from 'react-router-dom';
// import DarkModeSwitcher from './DarkModeSwitcher'; // TODO: Implement later
import { FiMenu } from 'react-icons/fi';
import { IoIosSearch } from "react-icons/io";

const Header = (props: {
    sidebarOpen: string | boolean | undefined;
    setSidebarOpen: (arg0: boolean) => void;
}) => {
    return (
        <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    {/* <!-- Hamburger Toggle BTN --> */}
                    <button
                        aria-controls="sidebar"
                        onClick={(e) => {
                            e.stopPropagation();
                            props.setSidebarOpen(!props.sidebarOpen);
                        }}
                        className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
                    >
                        <FiMenu className="text-xl" />
                    </button>

                    <Link className="block flex-shrink-0 lg:hidden" to="/">
                        {/* Mobile Logo if needed */}
                        <span className="font-bold text-lg text-primary">MyRush</span>
                    </Link>
                </div>

                <div className="hidden sm:block">
                    <form action="https://formbold.com/s/unique_form_id" method="POST">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <IoIosSearch className="text-xl text-bodydark2 hover:text-primary" />
                            </button>

                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 text-black focus:outline-none dark:text-white xl:w-125"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        {/* Dark mode switcher placeholder */}
                    </ul>

                    {/* <!-- User Area --> */}
                    <div className="hidden lg:block relative">
                        <Link className="flex items-center gap-4" to="/profile">
                            <span className="hidden text-right lg:block">
                                <span className="block text-sm font-medium text-black dark:text-white">
                                    Administrator
                                </span>
                                <span className="block text-xs">Admin</span>
                            </span>

                            <span className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="User" />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
