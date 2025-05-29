import React, { useEffect } from "react";

interface QRCodeModalProps {
    qrData: string;
    onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ qrData, onClose }) => {
    useEffect(() => {
        const popup = window.open("", "_blank", "width=400,height=480");

        if (!popup) {
            alert("Nie udało się otworzyć okna. Upewnij się, że przeglądarka nie blokuje wyskakujących okienek.");
            return;
        }

        const doc = popup.document;
        doc.write(`
            <html>
                <head>
                    <title>Kod QR</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: sans-serif;
                            background: #fff;
                        }
                        #qrcode {
                            margin-bottom: 20px;
                        }
                        button {
                            padding: 10px 20px;
                            font-size: 16px;
                            background-color: #9C2F3B;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        }
                        button:hover {
                            background-color: #7b242f;
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
                </head>
                <body>
                    <div id="qrcode"></div>
                    <button onclick="window.print()">🖨️ Drukuj</button>
                    <script>
                        new QRCode(document.getElementById("qrcode"), {
                            text: ${JSON.stringify(qrData)},
                            width: 256,
                            height: 256
                        });
                    </script>
                </body>
            </html>
        `);

        doc.close();
        onClose();
    }, [qrData, onClose]);

    return null;
};

export default QRCodeModal;
