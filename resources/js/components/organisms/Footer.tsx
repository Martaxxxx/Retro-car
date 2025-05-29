function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4">
                <p className="text-center">© {new Date().getFullYear()} RetroCar. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;