import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import robotoFont from "../styles/fonts/Roboto_Italic";
import { ShoppingItem } from "../components/ShoppingListTable";
import { ProjectData } from "../pages/projectData";

export const generateShoppingListPdf = (project: ProjectData, items: ShoppingItem[]) => {
    if (!project || items.length === 0) {
        console.error("Brak danych do wygenerowania PDF");
        return;
    }

    const doc = new jsPDF();
    doc.addFileToVFS("Roboto-Italic.ttf", robotoFont);
    doc.addFont("Roboto-Italic.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    const marginLeft = 20;
    const logo = new Image();
    logo.src = `${window.location.origin}/retro3.png`;
    doc.addImage(logo, "PNG", 180, 10, 20, 18);

    doc.setFontSize(16);
    doc.text(`${project.name} / ${project.carId}`, marginLeft, 20);

    doc.setFontSize(12);
    let y = 40;
    const totalNet = items.reduce((sum, i) => sum + Number(i.priceNet), 0).toFixed(2);
    const totalGross = items.reduce((sum, i) => sum + Number(i.priceGross), 0).toFixed(2);
    const counts = {
        dozamowienia: items.filter(i => i.status === "dozamowienia").length,
        zamowione: items.filter(i => i.status === "zamowione").length,
        dostarczone: items.filter(i => i.status === "dostarczone").length,
    };

    const summaryLines = [
        `Łączna kwota netto: ${totalNet} zł`,
        `Łączna kwota brutto: ${totalGross} zł`,
        `Liczba pozycji: ${items.length}`,
        `Statusy:`,
        `- Do zamówienia: ${counts.dozamowienia}`,
        `- Zamówione: ${counts.zamowione}`,
        `- Dostarczone: ${counts.dostarczone}`,
    ];

    summaryLines.forEach(line => {
        doc.text(line, marginLeft, y);
        y += 8;
    });

    const checkIcon = `${window.location.origin}/check.png`;

    autoTable(doc, {
        startY: y,
        head: [["Nazwa", "Notatki", "K.netto", "K.brutto", "Status", "Link", "Załączniki"]],
        body: items.map(item => [
            item.name,
            item.notes,
            `${item.priceNet.toFixed(2)} zł`,
            `${item.priceGross.toFixed(2)} zł`,
            statusLabel(item.status),
            "", // link
            ""  // faktura
        ]),
        didDrawCell: (data) => {
            if (data.section !== "body") return;
            const item = items[data.row.index];

            if (data.column.index === 5 && item.link) {
                doc.setTextColor("#9C2F3B");
                doc.setFontSize(9);
                doc.textWithLink("Zobacz", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 3, {
                    url: item.link,
                    align: "center"
                });
            }

            if (data.column.index === 6 && item.invoiceAttached) {
                const size = 6;
                const x = data.cell.x + (data.cell.width - size) / 2;
                const y = data.cell.y + (data.cell.height - size) / 2;
                doc.addImage(checkIcon, "PNG", x, y, size, size);
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

    const now = new Date().toLocaleDateString("pl-PL");
    doc.setFontSize(10);
    doc.text(`Wygenerowano przez: Marta Kowalska`, 10, doc.internal.pageSize.height - 16);
    doc.text(`Data wygenerowania: ${now}`, 10, doc.internal.pageSize.height - 10);

    doc.save(`${project.name}_lista_zakupow.pdf`);
};

const statusLabel = (status: ShoppingItem["status"]) => {
    switch (status) {
        case "dozamowienia": return "Do zamówienia";
        case "zamowione": return "Zamówione";
        case "dostarczone": return "Dostarczone";
        default: return status;
    }
};
