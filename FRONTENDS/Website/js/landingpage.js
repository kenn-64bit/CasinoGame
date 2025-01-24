fetch('landingpage.html')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load content');
        return response.text();
      })
      .then(html => {
        document.getElementById('imported-section').innerHTML = html;
      })
      .catch(error => console.error('Error:', error));