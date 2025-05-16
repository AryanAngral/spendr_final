// Sample tax documents data (in a real app, this would come from a backend)
const taxDocuments = {
    'form16': {
        name: 'Form 16',
        type: 'Salary',
        date: '2024-03-31',
        amount: 1200000,
        status: 'Verified',
        fileUrl: './tax-documents/form16_2024.pdf',
        previewUrl: './tax-documents/form16_2024_preview.pdf'
    },
    '80c': {
        name: '80C Proof',
        type: 'Investment',
        date: '2024-03-15',
        amount: 150000,
        status: 'Pending',
        fileUrl: './tax-documents/80c_proof_2024.pdf',
        previewUrl: './tax-documents/80c_proof_2024_preview.pdf'
    },
    'rent': {
        name: 'Rent Receipts',
        type: 'HRA',
        date: '2024-03-31',
        amount: 240000,
        status: 'Verified',
        fileUrl: './tax-documents/rent_receipts_2024.pdf',
        previewUrl: './tax-documents/rent_receipts_2024_preview.pdf'
    }
};

// Function to view a tax document
function viewTaxDocument(documentType) {
    const document = taxDocuments[documentType];
    if (!document) {
        showNotification('Document not found', 'error');
        return;
    }

    // Create a modal to show the document preview
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal document-preview-modal">
            <div class="modal-header">
                <h2>${document.name}</h2>
                <button onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="document-preview">
                <iframe src="${document.previewUrl}" width="100%" height="500px"></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Function to download a tax document
function downloadTaxDocument(documentType) {
    const document = taxDocuments[documentType];
    if (!document) {
        showNotification('Document not found', 'error');
        return;
    }

    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = `${document.name.toLowerCase().replace(/\s+/g, '_')}_${new Date(document.date).getFullYear()}.pdf`;
    
    // Add the link to the document and trigger the click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    // Show success notification
    showNotification('Document download started', 'success');
}

// Function to initialize document action buttons
function initTaxDocumentActions() {
    const actionButtons = document.querySelectorAll('.tax-document-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const documentType = e.target.dataset.document;
            
            if (action === 'view') {
                viewTaxDocument(documentType);
            } else if (action === 'download') {
                downloadTaxDocument(documentType);
            }
        });
    });
} 