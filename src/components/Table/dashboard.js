// Dashboard functionality with sticky columns support
class KPIDashboard {
    constructor() {
        this.table = document.querySelector("table");
        this.tableWrapper = document.querySelector(".table-wrapper");
        this.periodSelect = document.getElementById("period-select");

        this.init();
    }

    init() {
        this.bindEvents();
        this.addInteractivity();
        this.setupStickyColumns();
    }

    bindEvents() {
        // Period selection change
        this.periodSelect.addEventListener("change", (e) => {
            this.handlePeriodChange(e.target.value);
        });

        // Cell click events: click vào .number sẽ toggle class highlight và hiệu ứng
        this.table.addEventListener("click", (e) => {
            const cell = e.target.closest("td.number");
            if (cell) {
                this.handleHighlightClick(cell);
            }
        });

        // Scroll event for sticky column shadows
        this.tableWrapper.addEventListener("scroll", (e) => {
            this.updateStickyColumnShadows(e.target.scrollLeft);
        });
    }

    setupStickyColumns() {
        // Ensure sticky columns have proper background colors and positioning
        const stickyHeaders = document.querySelectorAll("thead th.sticky-col");
        const stickyCells = document.querySelectorAll("tbody td.sticky-col");

        // Set proper background for sticky header elements
        stickyHeaders.forEach((header) => {
            // header.style.backgroundColor = "#718096";
            header.style.position = "sticky";
        });

        // Set proper background for sticky body cells
        stickyCells.forEach((cell) => {
            cell.style.backgroundColor = "white";
            cell.style.position = "sticky";

            // Ensure the cell maintains its sticky position
            if (cell.classList.contains("sticky-col-1")) {
                cell.style.left = "0px";
            } else if (cell.classList.contains("sticky-col-2")) {
                cell.style.left = "240px";
            }
        });

        // Force a repaint to ensure sticky positioning takes effect
        this.tableWrapper.style.transform = "translateZ(0)";
    }

    updateStickyColumnShadows(scrollLeft) {
        const stickyCol1 = document.querySelectorAll(".sticky-col-1");
        const stickyCol2 = document.querySelectorAll(".sticky-col-2");

        // Add/remove shadow based on scroll position
        // if (scrollLeft > 0) {
        //     stickyCol2.forEach((col) => {
        //         col.style.boxShadow = "2px 0 4px rgba(0,0,0,0.1)";
        //     });
        // } else {
        //     stickyCol2.forEach((col) => {
        //         col.style.boxShadow = "none";
        //     });
        // }
    }

    addInteractivity() {
        // Đã bỏ hoàn toàn hiệu ứng hover, không có logic nào liên quan đến hover ở đây
    }

    handleHighlightClick(highlightElement) {
        // Xác định index của cell được click trong hàng của nó
        const cellIndex = Array.from(
            highlightElement.parentNode.children
        ).indexOf(highlightElement);
        // Xác định hàng của cell được click
        const rows = Array.from(this.table.querySelectorAll("tbody tr"));
        const clickedRowIndex = rows.findIndex((row) =>
            Array.from(row.children).includes(highlightElement)
        );

        // Tìm nhóm 3 hàng (0-2, 3-5, 6-8, ...)
        const groupStart = Math.floor(clickedRowIndex / 3) * 3;
        // Kiểm tra nếu cả 3 ô trong nhóm đều đã được highlight thì sẽ bỏ highlight, ngược lại thì highlight
        let allHighlighted = true;
        let groupCells = [];
        for (let i = 0; i < 3; i++) {
            const row = rows[groupStart + i];
            if (row) {
                const cells = row.querySelectorAll("td");
                if (
                    cells[cellIndex] &&
                    cells[cellIndex].classList.contains("number")
                ) {
                    const cell = cells[cellIndex];
                    groupCells.push(cell);
                    if (!cell.classList.contains("highlight")) {
                        allHighlighted = false;
                    }
                }
            }
        }

        if (allHighlighted) {
            // Nếu đã highlight rồi thì bỏ highlight nhóm này
            groupCells.forEach((cell) => {
                cell.classList.remove("highlight", "active");
                cell.style.background = "";
                cell.style.color = "";
                cell.style.borderRadius = "";
                cell.style.borderTopLeftRadius = "";
                cell.style.borderTopRightRadius = "";
                cell.style.borderBottomLeftRadius = "";
                cell.style.borderBottomRightRadius = "";
            });
            return;
        }

        // Highlight nhóm 3 ô (không ảnh hưởng nhóm khác)
        groupCells.forEach((cell, i) => {
            cell.classList.add("highlight", "active");
            if (i === 0) cell.classList.add("group-top");
            else cell.classList.remove("group-top");
            if (i === 2) cell.classList.add("group-bottom");
            else cell.classList.remove("group-bottom");
            cell.style.background = "#F08065";
            cell.style.color = "#fff";
            // Bo góc cho ô đầu và cuối nhóm
            if (i === 0) {
                cell.style.borderTopLeftRadius = "10px";
                cell.style.borderTopRightRadius = "10px";
                cell.style.borderBottomLeftRadius = "0";
                cell.style.borderBottomRightRadius = "0";
            } else if (i === 2) {
                cell.style.borderTopLeftRadius = "0";
                cell.style.borderTopRightRadius = "0";
                cell.style.borderBottomLeftRadius = "10px";
                cell.style.borderBottomRightRadius = "10px";
            } else {
                cell.style.borderRadius = "0";
            }
            // Optional animation
            cell.style.animation = "pulse 0.5s ease-in-out";
            setTimeout(() => {
                cell.style.animation = "";
            }, 500);
        });
    }

    // Cập nhật method removeHighlights để xóa selected khi di chuột ra
    removeHighlights() {
        // Remove row highlights
        const rows = document.querySelectorAll("tbody tr");
        rows.forEach((row) => {
            row.style.backgroundColor = "";
        });

        // Remove cell highlights
        const cells = document.querySelectorAll("tbody td:not(.sticky-col)");
        cells.forEach((cell) => {
            cell.style.backgroundColor = "";
        });

        // Không xóa class row-selected ở đây để giữ trạng thái selected khi click
    }

    handlePeriodChange(period) {
        console.log("Period changed to:", period);

        // Update headers based on period
        const headers = document.querySelectorAll("thead th:not(.sticky-col)");

        switch (period) {
            case "年":
                this.updateHeadersForYear(headers);
                break;
            case "週":
                this.updateHeadersForWeek(headers);
                break;
            case "日":
                this.updateHeadersForDay(headers);
                break;
            default:
                this.updateHeadersForMonth(headers);
        }

        this.animateDataUpdate();
    }

    updateHeadersForYear(headers) {
        const yearHeaders = [
            "2023",
            "2024",
            "2025",
            "2026",
            "2027",
            "2028",
            "2029",
            "2030",
            "2031",
            "2032",
        ];
        headers.forEach((header, index) => {
            if (yearHeaders[index]) {
                header.textContent = yearHeaders[index];
            }
        });
    }

    updateHeadersForWeek(headers) {
        const weekHeaders = [
            "W32",
            "W33",
            "W34",
            "W35",
            "W36",
            "W37",
            "W38",
            "W39",
            "W40",
            "W41",
        ];
        headers.forEach((header, index) => {
            if (weekHeaders[index]) {
                header.textContent = weekHeaders[index];
            }
        });
    }

    updateHeadersForDay(headers) {
        const dayHeaders = [
            "8/1",
            "8/2",
            "8/3",
            "8/4",
            "8/5",
            "8/6",
            "8/7",
            "8/8",
            "8/9",
            "8/10",
        ];
        headers.forEach((header, index) => {
            if (dayHeaders[index]) {
                header.textContent = dayHeaders[index];
            }
        });
    }

    updateHeadersForMonth(headers) {
        const monthHeaders = [
            "2025/8",
            "2025/9",
            "2025/10",
            "2025/11",
            "2025/12",
            "2026/1",
            "2026/2",
            "2026/3",
            "2026/4",
            "2026/5",
        ];
        headers.forEach((header, index) => {
            if (monthHeaders[index]) {
                header.textContent = monthHeaders[index];
            }
        });
    }

    animateDataUpdate() {
        const dataCells = document.querySelectorAll(
            "tbody td:not(.sticky-col)"
        );

        dataCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transform = "scale(1.02)";
                cell.style.transition = "transform 0.15s ease";

                setTimeout(() => {
                    cell.style.transform = "scale(1)";
                }, 150);
            }, index * 10);
        });
    }

    // Export functionality
    exportToCSV() {
        const rows = Array.from(this.table.querySelectorAll("tr"));

        const csvContent = rows
            .map((row) => {
                const cells = Array.from(row.querySelectorAll("th, td"));
                return cells
                    .map((cell) => {
                        let text = cell.textContent.trim();
                        // Remove highlight spans and get just the text
                        const highlight = cell.querySelector(".highlight");
                        if (highlight) {
                            text = highlight.textContent.trim();
                        }
                        return `"${text.replace(/"/g, '""')}"`;
                    })
                    .join(",");
            })
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "kpi-dashboard.csv");
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const dashboard = new KPIDashboard();
    console.log("hheeh");

    // Make export function available globally
    window.exportToCSV = () => dashboard.exportToCSV();
});

// Add CSS animation for pulse effect
const style = document.createElement("style");
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .sticky-col.scrolled::after {
        opacity: 1;
    }

    .sticky-col::after {
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    /* Animation for row selection */
    tr.row-selected {
        transition: all 0.3s ease;
    } 
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case "1":
                e.preventDefault();
                document.getElementById("period-select").value = "日";
                document
                    .getElementById("period-select")
                    .dispatchEvent(new Event("change"));
                break;
            case "2":
                e.preventDefault();
                document.getElementById("period-select").value = "週";
                document
                    .getElementById("period-select")
                    .dispatchEvent(new Event("change"));
                break;
            case "3":
                e.preventDefault();
                document.getElementById("period-select").value = "月";
                document
                    .getElementById("period-select")
                    .dispatchEvent(new Event("change"));
                break;
            case "4":
                e.preventDefault();
                document.getElementById("period-select").value = "年";
                document
                    .getElementById("period-select")
                    .dispatchEvent(new Event("change"));
                break;
            case "e":
                e.preventDefault();
                window.exportToCSV();
                break;
        }
    }
});
