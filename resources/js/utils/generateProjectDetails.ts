import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import robotoFont from "../styles/fonts/Roboto_Italic";
import { Part, ProjectData } from "../pages/projectData";

const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

export const generateProjectDetails = async (project: ProjectData) => {
    const doc = new jsPDF();
    doc.addFileToVFS("Roboto-Italic.ttf", robotoFont);
    doc.addFont("Roboto-Italic.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    const logo = await loadImageAsync(`${window.location.origin}/retro3.png`);
    doc.addImage(logo, "PNG", 180, 5, 20, 18);

    doc.setFontSize(16);
    doc.text(`Szczegóły projektu: ${project.name}`, 10, 10);

    let currentY = 30;
    const lines = [
        `Status: ${project.status}`,
        `Marka: ${project.brand}`,
        `Model: ${project.model}`,
        `Rocznik: ${project.year}`,
        `Numer zlecenia: ${project.carId}`,
        `Użytkownicy: ${project.assignedTo?.join(", ") || "Brak danych"}`
    ];
    lines.forEach(line => {
        doc.setFontSize(12);
        doc.text(line, 10, currentY);
        currentY += 10;
    });

    doc.setFontSize(14);
    doc.text("Części:", 10, currentY);
    currentY += 10;

    const qrCodes: Record<string, string> = {};
    for (const part of project.parts) {
        try {
            qrCodes[part.id] = await QRCode.toDataURL(`${project.name}, ${part.partCode}, ${part.name}`);
        } catch {
            qrCodes[part.id] = "";
        }
    }

    const statusMap: Record<Part["status"], string> = {
        pending: "W przygotowaniu",
        ready: "Gotowy do montażu",
        installed: "Zamontowany"
    };

    autoTable(doc, {
        startY: currentY,
        margin: { left: 10 },
        head: [["QR Kod", "Kod", "Nazwa", "Kategoria", "Notatki", "Status"]],
        body: project.parts.map(part => [
            { qrId: part.id },
            part.partCode || "-",
            part.name?.normalize("NFC") || "-",
            part.category?.normalize("NFC") || "-",
            part.notes?.normalize("NFC") || "-",
            statusMap[part.status]
        ]),
        didDrawCell: (data) => {
            if (data.column.index === 0 && data.row.raw[0]?.qrId) {
                const qrImage = qrCodes[data.row.raw[0].qrId];
                if (qrImage) {
                    const size = 20;
                    const x = data.cell.x + (data.cell.width - size) / 2;
                    const y = data.cell.y + 2;
                    doc.addImage(qrImage, "PNG", x, y, size, size);
                }
            }

            if (data.section === 'head' && data.row.index === 0) {
                const r = 4;
                const { x, y, width, height } = data.cell;
                doc.setFillColor(156, 47, 59);
                if (data.column.index === 0 || data.column.index === 5) {
                    doc.roundedRect(x, y, width, height, r, r, 'F');
                } else {
                    doc.rect(x, y, width, height, 'F');
                }
                doc.setTextColor(255);
                doc.setFontSize(9);
                doc.text(data.cell.text[0], x + width / 2, y + height / 2 + 2.5, { align: "center" });
            }
        },
        styles: {
            font: "Roboto",
            fontSize: 9,
            fontStyle: "normal",
            minCellHeight: 28,
            halign: "center",
            valign: "middle"
        },
        headStyles: {
            font: "Roboto",
            fontSize: 10,
            fontStyle: "normal",
            minCellHeight: 12,
            fillColor: [156, 47, 59],
            textColor: 255,
            halign: "center",
            valign: "middle"
        },
        columnStyles: {
            5: { cellWidth: 35 }
        }
    });

    const table = doc.lastAutoTable;
    if (table?.table) {
        const { x, y, width, height } = table.table;
        doc.setDrawColor(156, 47, 59);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, height, 6, 6);
    }

    const now = new Date().toLocaleDateString("pl-PL");
    doc.setFontSize(10);
    doc.text(`Wygenerowano przez: Marta Kowalska`, 10, doc.internal.pageSize.height - 16);
    doc.text(`Data wygenerowania: ${now}`, 10, doc.internal.pageSize.height - 10);

    doc.save(`${project.name || "projekt"}_details.pdf`);
};
