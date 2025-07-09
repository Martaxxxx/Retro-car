import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pl } from "date-fns/locale";
import Navbar from "../components/Navbar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import robotoFont from "../styles/fonts/Roboto_Italic";
import * as XLSX from "xlsx";
import axios from "../axios"; 
import { useUser } from "../components/context/UserContext"; 

type ShoppingItem = {
  id: string;
  name: string;
  priceNet: number;
  priceGross: number;
  status: "dozamowienia" | "zamowione" | "dostarczone";
  createdAt?: string;
};

type ProjectData = {
  id: string;
  name: string;
  shoppingList?: ShoppingItem[];
  parts?: { status: "pending" | "ready" | "installed" }[];
};

const statusWeights = {
  pending: 0,
  ready: 50,
  installed: 100,
};

const dateString = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  if (typeof d === "string") return d.substring(0, 10);
  return d.toISOString().substring(0, 10);
};

const filterByDate = (
  itemDateStr: string | undefined,
  startDate: Date | null,
  endDate: Date | null
) => {
  if (!itemDateStr) return true;
  const startStr = dateString(startDate) ?? undefined;
  const endStr = dateString(endDate) ?? undefined;
  return (!startStr || itemDateStr >= startStr) && (!endStr || itemDateStr <= endStr);
};

const ReportsPage: React.FC = () => {
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportType, setReportType] = useState<"costs" | "progress" | "">("");

  const { user } = useUser(); // Dodane

  // Pobierz projekty z backendu i zmapuj shopping_items na shoppingList
  useEffect(() => {
    axios.get("/projects")
      .then(res => {
        const mapped = res.data.map((p: any) => ({
          ...p,
          shoppingList: p.shopping_items ?? [],
        }));
        setAllProjects(mapped);
      })
      .catch(err => console.error("Błąd pobierania projektów:", err));
  }, []);

  const handleCheckboxChange = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProjectIds([]);
    } else {
      const allIds = allProjects.map((p) => p.id);
      setSelectedProjectIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  const renderHeader = ({ date, decreaseMonth, increaseMonth }: any) => (
    <div className="d-flex justify-content-between align-items-center px-2 py-1">
      <button
        style={{ background: "none", border: "none", fontSize: "20px" }}
        onClick={decreaseMonth}
      >
        ‹
      </button>
      <div className="text-center" style={{ lineHeight: "1.2" }}>
        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
          {date.toLocaleDateString("pl-PL", { month: "long" })}
        </div>
        <div style={{ fontSize: "20px" }}>{date.getFullYear()}</div>
      </div>
      <button
        style={{ background: "none", border: "none", fontSize: "20px" }}
        onClick={increaseMonth}
      >
        ›
      </button>
    </div>
  );

  const getProgressSummary = () => {
    const selectedProjects = allProjects.filter((p) =>
      selectedProjectIds.includes(p.id)
    );

    let totalParts = 0;
    let totalProgressSum = 0;
    let statusCountTotal = { pending: 0, ready: 0, installed: 0 };

    const projectsProgress = selectedProjects.map((project) => {
      const parts = (project as any).parts || [];
      const count = parts.length;
      const statuses = { pending: 0, ready: 0, installed: 0 };

      const progressSum = parts.reduce((sum: number, part: any) => {
        statuses[part.status]++;
        return sum + (statusWeights[part.status] || 0);
      }, 0);

      const avgProgress = count > 0 ? progressSum / count : 0;

      totalParts += count;
      totalProgressSum += progressSum;
      statusCountTotal.pending += statuses.pending;
      statusCountTotal.ready += statuses.ready;
      statusCountTotal.installed += statuses.installed;

      return {
        name: project.name,
        count,
        progressPercent: Math.round(avgProgress),
        statusBreakdown: { ...statuses },
      };
    });

    const globalProgress = totalParts > 0 ? Math.round(totalProgressSum / totalParts) : 0;

    return {
      projectsProgress,
      globalProgress,
      statusCountTotal,
      totalParts,
    };
  };

  const handleGenerateProgressPdf = () => {
    const doc = new jsPDF();

    doc.addFileToVFS("Roboto-Italic.ttf", robotoFont);
    doc.addFont("Roboto-Italic.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    const marginLeft = 20;
    const logo = new Image();
    logo.src = `${window.location.origin}/retro3.png`;
    doc.addImage(logo, "PNG", 180, 10, 20, 18);

    doc.setFontSize(16);
    doc.text("Raport postępów projektów", marginLeft, 20);

    doc.setFontSize(12);
    doc.text(
      `Zakres dat: ${startDate?.toLocaleDateString() || "-"} – ${endDate?.toLocaleDateString() || "-"}`,
      marginLeft,
      30
    );

    const summary = getProgressSummary();
    const data = summary.projectsProgress.map((p) => [
      p.name,
      `${p.progressPercent}%`,
      p.count,
      p.statusBreakdown.pending,
      p.statusBreakdown.ready,
      p.statusBreakdown.installed,
    ]);
    data.push([
      "PODSUMOWANIE",
      `${summary.globalProgress}%`,
      summary.totalParts,
      summary.statusCountTotal.pending,
      summary.statusCountTotal.ready,
      summary.statusCountTotal.installed,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Projekt", "(%)", "Liczba cz.", "W przygotowaniu", "Gotowe", "Zamontowane"]],
      body: data,
      styles: {
        font: "Roboto",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        minCellHeight: 12,
      },
      headStyles: {
        fontSize: 10,
        fillColor: [156, 47, 59],
        textColor: 255,
        halign: "center",
      },
    });

    doc.setFontSize(10);
    const now = new Date().toLocaleDateString("pl-PL");
    doc.text(`Wygenerowano przez: Marta Kowalska`, 10, doc.internal.pageSize.height - 16);
    doc.text(`Data wygenerowania: ${now}`, 10, doc.internal.pageSize.height - 10);

    doc.save(`raport_postepow.pdf`);
  };

  const handleGenerateProgressXls = () => {
    const summary = getProgressSummary();
    const data = summary.projectsProgress.map((p) => [
      p.name,
      p.progressPercent,
      p.count,
      p.statusBreakdown.pending,
      p.statusBreakdown.ready,
      p.statusBreakdown.installed,
    ]);
    data.push([
      "SUMA/ŚREDNIA",
      summary.globalProgress,
      summary.totalParts,
      summary.statusCountTotal.pending,
      summary.statusCountTotal.ready,
      summary.statusCountTotal.installed,
    ]);
    const wsData = [
      ["Projekt", "Postęp (%)", "Liczba części", "W przygotowaniu", "Gotowe", "Zamontowane"],
      ...data,
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raport postępów");
    XLSX.writeFile(workbook, "raport_postepow.xlsx");
  };

  const getSummaryData = () => {
    const selectedProjects = allProjects.filter((p) =>
      selectedProjectIds.includes(p.id)
    );

    let totalNetAll = 0;
    let totalGrossAll = 0;
    let totalCountAll = 0;
    let totalStatus = {
      dozamowienia: 0,
      zamowione: 0,
      dostarczone: 0,
    };

    selectedProjects.forEach((project) => {
      const items =
        (project as any).shoppingList?.filter((item: ShoppingItem) => {
          const itemDateStr = dateString(item.createdAt);
          return filterByDate(itemDateStr, startDate, endDate);
        }) || [];

      totalNetAll += items.reduce((sum, i) => sum + i.priceNet, 0);
      totalGrossAll += items.reduce((sum, i) => sum + i.priceGross, 0);
      totalCountAll += items.length;
      totalStatus.dozamowienia += items.filter((i) => i.status === "dozamowienia").length;
      totalStatus.zamowione += items.filter((i) => i.status === "zamowione").length;
      totalStatus.dostarczone += items.filter((i) => i.status === "dostarczone").length;
    });

    return { totalNetAll, totalGrossAll, totalCountAll, totalStatus };
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF();

    doc.addFileToVFS("Roboto-Italic.ttf", robotoFont);
    doc.addFont("Roboto-Italic.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    const marginLeft = 20;
    const logo = new Image();
    logo.src = `${window.location.origin}/retro3.png`;
    doc.addImage(logo, "PNG", 180, 10, 20, 18);

    doc.setFontSize(16);
    doc.text("Zbiorczy raport kosztów", marginLeft, 20);

    doc.setFontSize(12);
    doc.text(
      `Zakres dat: ${startDate?.toLocaleDateString() || "-"} – ${endDate?.toLocaleDateString() || "-"}`,
      marginLeft,
      30
    );

    const selectedProjects = allProjects.filter((p) =>
      selectedProjectIds.includes(p.id)
    );

    let totalNetAll = 0;
    let totalGrossAll = 0;
    let totalCountAll = 0;
    let totalStatus = {
      dozamowienia: 0,
      zamowione: 0,
      dostarczone: 0,
    };

    const data = selectedProjects.map((project) => {
      const items =
        (project as any).shoppingList?.filter((item: ShoppingItem) => {
          const itemDateStr = dateString(item.createdAt);
          return filterByDate(itemDateStr, startDate, endDate);
        }) || [];

      const totalNet = items.reduce((sum, i) => sum + i.priceNet, 0);
      const totalGross = items.reduce((sum, i) => sum + i.priceGross, 0);
      const statusCount = {
        dozamowienia: items.filter((i) => i.status === "dozamowienia").length,
        zamowione: items.filter((i) => i.status === "zamowione").length,
        dostarczone: items.filter((i) => i.status === "dostarczone").length,
      };

      totalNetAll += totalNet;
      totalGrossAll += totalGross;
      totalCountAll += items.length;
      totalStatus.dozamowienia += statusCount.dozamowienia;
      totalStatus.zamowione += statusCount.zamowione;
      totalStatus.dostarczone += statusCount.dostarczone;

      return [
        project.name,
        `${totalNet.toFixed(2)} zł`,
        `${totalGross.toFixed(2)} zł`,
        items.length,
        statusCount.dozamowienia,
        statusCount.zamowione,
        statusCount.dostarczone,
      ];
    });

    data.push([
      "SUMA",
      `${totalNetAll.toFixed(2)} zł`,
      `${totalGrossAll.toFixed(2)} zł`,
      totalCountAll,
      totalStatus.dozamowienia,
      totalStatus.zamowione,
      totalStatus.dostarczone,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        ["Projekt", "Netto", "Brutto", "Pozycji", "Do zamówienia", "Zamówione", "Dostarczone"],
      ],
      body: data,
      styles: {
        font: "Roboto",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        minCellHeight: 12,
      },
      headStyles: {
        fontSize: 10,
        fillColor: [156, 47, 59],
        textColor: 255,
        halign: "center",
      },
    });

    const now = new Date().toLocaleDateString("pl-PL");
    doc.setFontSize(10);
    doc.text(`Wygenerowano przez: Marta Kowalska`, 10, doc.internal.pageSize.height - 16);
    doc.text(`Data wygenerowania: ${now}`, 10, doc.internal.pageSize.height - 10);

    doc.save(`raport_zakupow.pdf`);
  };

  const handleGenerateXls = () => {
    const summary = getSummaryData();
    const selectedProjects = allProjects.filter((p) =>
      selectedProjectIds.includes(p.id)
    );

    const data = selectedProjects.map((project) => {
      const items =
        (project as any).shoppingList?.filter((item: ShoppingItem) => {
          const itemDateStr = dateString(item.createdAt);
          return filterByDate(itemDateStr, startDate, endDate);
        }) || [];

      const totalNet = items.reduce((sum, i) => sum + i.priceNet, 0);
      const totalGross = items.reduce((sum, i) => sum + i.priceGross, 0);
      const statusCount = {
        dozamowienia: items.filter((i) => i.status === "dozamowienia").length,
        zamowione: items.filter((i) => i.status === "zamowione").length,
        dostarczone: items.filter((i) => i.status === "dostarczone").length,
      };

      return [
        project.name,
        totalNet.toFixed(2),
        totalGross.toFixed(2),
        items.length,
        statusCount.dozamowienia,
        statusCount.zamowione,
        statusCount.dostarczone,
      ];
    });

    const wsData = [
      ["Projekt", "Netto", "Brutto", "Pozycji", "Do zamówienia", "Zamówione", "Dostarczone"],
      ...data,
      [
        "SUMA",
        summary.totalNetAll.toFixed(2),
        summary.totalGrossAll.toFixed(2),
        summary.totalCountAll,
        summary.totalStatus.dozamowienia,
        summary.totalStatus.zamowione,
        summary.totalStatus.dostarczone,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raport");
    XLSX.writeFile(workbook, "raport_zakupow.xlsx");
  };

  // ----------- BLOKADA RAPORTU KOSZTÓW DLA ZWYKŁEGO USERA -----------
  const isCostReportVisible = !!user?.roles && !user.roles.includes("user");

  // Jeśli user nie jest jeszcze załadowany, możesz pokazać loader albo oba radio
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 pt-5">
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div className="spinner-border" role="status" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5 pt-5">
        <div
          style={{
            backgroundImage: `url('/raporty.png')`,
            backgroundSize: "150px",
            backgroundPosition: "right top",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local",
            padding: "40px",
            borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.96)",
          }}
        >
          <h2 className="fw-bold mb-4">Raporty</h2>

          <div className="row g-4 mb-5">
            <div className="col-md-6 d-flex flex-column">
              <label className="fw-semibold mb-2">Data od:</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="Wybierz datę startu"
                locale={pl}
                todayButton="Dzisiaj"
                renderCustomHeader={renderHeader}
              />
            </div>
            <div className="col-md-6 d-flex flex-column">
              <label className="fw-semibold mb-2">Data do:</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="Wybierz datę zakończenia"
                locale={pl}
                todayButton="Dzisiaj"
                minDate={startDate ?? undefined}
                renderCustomHeader={renderHeader}
              />
            </div>
          </div>

          <h5 className="mb-4">Rodzaj raportu:</h5>
          <div className="d-flex flex-column mt-3 mb-4 gap-3">
            {isCostReportVisible && (
              <div>
                <input
                  type="radio"
                  id="cost"
                  name="reportType"
                  value="costs"
                  onChange={() => setReportType("costs")}
                  checked={reportType === "costs"}
                />
                <label htmlFor="cost" className="ms-2">
                  Raport kosztów
                </label>
              </div>
            )}
            <div>
              <input
                type="radio"
                id="progress"
                name="reportType"
                value="progress"
                onChange={() => setReportType("progress")}
                checked={reportType === "progress"}
              />
              <label htmlFor="progress" className="ms-2">
                Raport postępów
              </label>
            </div>
          </div>

          {reportType && (
            <>
              <h5 className="fw-bold mb-3">Wybierz projekty do raportu:</h5>
              <div className="d-flex flex-column gap-2 rounded border bg-white p-3">
                <div>
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="selectAll" className="fw-semibold ms-2">
                    Zaznacz wszystkie
                  </label>
                </div>
                {allProjects.map((project) => (
                  <div key={project.id}>
                    <input
                      type="checkbox"
                      id={project.id}
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => handleCheckboxChange(project.id)}
                    />
                    <label htmlFor={project.id} className="ms-3">
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {reportType === "costs" && selectedProjectIds.length > 0 && (() => {
            const summary = getSummaryData();
            return (
              <div className="bg-light mt-5 rounded border p-4">
                <h5 className="fw-bold mb-3">Podsumowanie raportu kosztów</h5>
                <p>
                  <strong>Zakres dat:</strong> {startDate?.toLocaleDateString() || "—"} – {endDate?.toLocaleDateString() || "—"}
                </p>
                <p>
                  <strong>Łączna kwota netto:</strong> {summary.totalNetAll.toFixed(2)} zł
                </p>
                <p>
                  <strong>Łączna kwota brutto:</strong> {summary.totalGrossAll.toFixed(2)} zł
                </p>
                <p>
                  <strong>Liczba pozycji:</strong> {summary.totalCountAll}
                </p>
                <p>
                  <strong>Statusy:</strong>
                </p>
                <ul>
                  <li>Do zamówienia: {summary.totalStatus.dozamowienia}</li>
                  <li>Zamówione: {summary.totalStatus.zamowione}</li>
                  <li>Dostarczone: {summary.totalStatus.dostarczone}</li>
                </ul>
              </div>
            );
          })()}

          {reportType === "progress" && selectedProjectIds.length > 0 && (() => {
            const summary = getProgressSummary();
            return (
              <div className="bg-light mt-5 rounded border p-4">
                <h5 className="fw-bold mb-3">Podsumowanie raportu postępów</h5>
                <p>
                  <strong>Zakres dat:</strong> {startDate?.toLocaleDateString() || "—"} – {endDate?.toLocaleDateString() || "—"}
                </p>
                <p>
                  <strong>Średni postęp wybranych projektów:</strong> {summary.globalProgress}%
                </p>
                <p>
                  <strong>Łączna liczba części:</strong> {summary.totalParts}
                </p>
                <p>
                  <strong>Statusy części:</strong>
                </p>
                <ul>
                  <li>W przygotowaniu: {summary.statusCountTotal.pending}</li>
                  <li>Gotowe do montażu: {summary.statusCountTotal.ready}</li>
                  <li>Zamontowane: {summary.statusCountTotal.installed}</li>
                </ul>
              </div>
            );
          })()}

          {reportType && selectedProjectIds.length > 0 && (
            <div className="mt-4">
              <h5 className="fw-bold mb-3">Eksportuj:</h5>
              <div className="d-flex flex-wrap gap-3">
                {reportType === "costs" ? (
                  <>
                    <button className="btn-bordo" onClick={handleGeneratePdf}>PDF</button>
                    <button className="btn-bordo" onClick={handleGenerateXls}>XLSX</button>
                  </>
                ) : (
                  <>
                    <button className="btn-bordo" onClick={handleGenerateProgressPdf}>PDF</button>
                    <button className="btn-bordo" onClick={handleGenerateProgressXls}>XLSX</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportsPage;