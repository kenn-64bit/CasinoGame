/* Sorting the table Js*/
function sortTable(columnIndex) {
  const table = document.getElementById("postsTable");
  const rows = Array.from(table.rows).slice(1); // Exclude the header row
  const ascending = table.dataset.sortOrder !== "asc";

  rows.sort((a, b) => {
    let valA = a.cells[columnIndex].innerText.trim();
    let valB = b.cells[columnIndex].innerText.trim();

    // Check if the column contains numeric data
    const isNumeric = !isNaN(valA) && !isNaN(valB);
    if (isNumeric) {
      valA = parseFloat(valA.replace(/,/g, "")); // Convert to number (handle commas if present)
      valB = parseFloat(valB.replace(/,/g, ""));
    }

    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });

  rows.forEach((row) => table.tBodies[0].appendChild(row));

  // Update sort order
  table.dataset.sortOrder = ascending ? "asc" : "desc";

  // Add classes to headers
  const headers = table.querySelectorAll("th");
  headers.forEach((th, index) => {
    if (index === columnIndex) {
      th.classList.toggle("asc", ascending);
      th.classList.toggle("desc", !ascending);
    } else {
      th.classList.remove("asc", "desc");
    }
  });
}

/*Search Bar Js*/
function searchTable() {
  const query = document.getElementById("searchBar").value.toLowerCase();
  const rows = document.querySelectorAll("#postsTable tbody tr");
  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

/*Delete Js */
document
  .querySelectorAll('form[action*="delete_user"]')
  .forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Are you sure you want to delete this user?")) {
        e.preventDefault();
      }
    });
  });
