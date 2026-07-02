"""DataMind BI — ReportLab PDF Generator.

Responsible for programmatically styling and rendering statistical reports
that strictly adhere to the 1993 IBGE Tabular Presentation Norms.
"""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

from app.models.domain_schemas import IBGETableSpec


def generate_ibge_pdf(spec: IBGETableSpec) -> BytesIO:
    """Generates an in-memory PDF containing an IBGE-compliant table.
    
    Strict visual rules applied:
    - No vertical lines anywhere (GRID is forbidden).
    - Horizontal lines only at: top of table, bottom of header, bottom of table.
    - Title at the top.
    - Source (Fonte) at the bottom.
    
    Args:
        spec: The Pydantic gatekeeper model ensuring structural validity.
        
    Returns:
        BytesIO buffer containing the compiled PDF binary data.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom IBGE Styles
    title_style = ParagraphStyle(
        'IBGETitle', 
        parent=styles['Heading2'], 
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    source_style = ParagraphStyle(
        'IBGESource', 
        parent=styles['Normal'],
        fontSize=8,
        spaceBefore=10
    )
    
    # 1. Add Title
    elements.append(Paragraph(spec.title, title_style))
    
    # 2. Build Table Data Arrays
    table_data = []
    
    # Headers
    headers = [col.header for col in spec.columns]
    table_data.append(headers)
    
    # Rows
    for row in spec.data:
        # Map JSON row keys to the defined columns safely, converting to string
        row_data = [str(row.get(col.accessor_key, "")) for col in spec.columns]
        table_data.append(row_data)
        
    # 3. Apply Strict IBGE Table Styles
    # Note: ReportLab TableStyle coordinates are (column, row). -1 means 'last'.
    table_style = TableStyle([
        # Headers alignment and font
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        
        # Body alignment and padding
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        
        # HORIZONTAL BORDERS ONLY (The core IBGE rule)
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, colors.black),  # Top of table
        ('LINEBELOW', (0, 0), (-1, 0), 1.0, colors.black),  # Bottom of header
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.black),# Bottom of table
    ])
    
    # Create the table, autosizing columns based on content
    pdf_table = Table(table_data)
    pdf_table.setStyle(table_style)
    
    elements.append(pdf_table)
    
    # 4. Add Source Citation
    elements.append(Paragraph(f"<b>Fonte:</b> {spec.source_footer}", source_style))
    
    # Render PDF to buffer
    doc.build(elements)
    buffer.seek(0)
    
    return buffer
