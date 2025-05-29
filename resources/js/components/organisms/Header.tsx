import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="bg-gray-800 text-white">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold">RetroCar</Link>
                    <nav>
                        <ul className="flex space-x-6">
                            <li><Link to="/" className="hover:text-blue-300">Home</Link></li>
                            <li><Link to="/car-models" className="hover:text-blue-300">Car Models</Link></li>
                            <li><Link to="/car-parts" className="hover:text-blue-300">Car Parts</Link></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;