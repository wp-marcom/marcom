import os
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

def remove_text_from_page(page):
    """
    Remove text content from a PDF page while preserving images/graphics.
    This removes the text layer that might contain parts of letters.
    """
    # Remove text content by clearing the content stream's text operators
    if '/Contents' in page:
        # Get the content stream
        content = page.get_contents()
        if content:
            # Read the content
            content_data = content.get_data()
            
            # Remove text-related PDF operators
            # BT/ET = begin/end text, Tj/TJ = show text, Td/TD/Tm/T* = text positioning
            text_operators = [b'BT', b'ET', b'Tj', b'TJ', b"'", b'"', 
                            b'Td', b'TD', b'Tm', b'T*', b'Tc', b'Tw', 
                            b'Tz', b'TL', b'Tf', b'Tr', b'Ts']
            
            # Simple approach: remove lines containing text operators
            lines = content_data.split(b'\n')
            filtered_lines = []
            skip_until_et = False
            
            for line in lines:
                # If we're inside a text block (between BT and ET), skip it
                if b'BT' in line:
                    skip_until_et = True
                    continue
                if b'ET' in line:
                    skip_until_et = False
                    continue
                if skip_until_et:
                    continue
                    
                # Also skip standalone text operators
                skip_line = False
                for op in text_operators:
                    if op in line:
                        skip_line = True
                        break
                
                if not skip_line:
                    filtered_lines.append(line)
            
            # Update the content stream
            new_content = b'\n'.join(filtered_lines)
            page.replace_contents(new_content)
    
    return page

def verify_pdf_size(pdf_path, expected_width_inches=3.0, expected_height_inches=3.0, tolerance=0.1):
    """
    Verify that a PDF is the expected size (within tolerance).
    Returns (is_valid, actual_width_inches, actual_height_inches)
    """
    reader = PdfReader(pdf_path)
    
    if len(reader.pages) == 0:
        return False, 0, 0
    
    # Check first page
    page = reader.pages[0]
    width_pts = float(page.mediabox.width)
    height_pts = float(page.mediabox.height)
    
    # Convert points to inches (72 points = 1 inch)
    width_inches = width_pts / 72
    height_inches = height_pts / 72
    
    # Check if within tolerance
    width_ok = abs(width_inches - expected_width_inches) <= tolerance
    height_ok = abs(height_inches - expected_height_inches) <= tolerance
    
    is_valid = width_ok and height_ok
    
    return is_valid, width_inches, height_inches

def crop_pdf_to_square(input_path, output_path, size_inches=2.72, remove_text=False):
    """
    Crop a PDF to a square of specified size (in inches).
    Crops from the center of each page.
    Optionally removes text content to avoid letter fragments.
    """
    # Convert inches to points (1 inch = 72 points)
    size_pts = size_inches * 72
    
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        # Remove text if requested
        if remove_text:
            page = remove_text_from_page(page)
        
        # Get original dimensions
        orig_width = float(page.mediabox.width)
        orig_height = float(page.mediabox.height)
        
        # Calculate crop coordinates (centered)
        center_x = orig_width / 2
        center_y = orig_height / 2
        
        half_size = size_pts / 2
        
        # Set new mediabox (left, bottom, right, top)
        page.mediabox.lower_left = (center_x - half_size, center_y - half_size)
        page.mediabox.upper_right = (center_x + half_size, center_y + half_size)
        
        writer.add_page(page)
    
    # Write output
    with open(output_path, 'wb') as f:
        writer.write(f)

def batch_crop_pdfs(input_dir, output_dir, size_inches=2.72, 
                    verify_size=True, expected_size_inches=3.0, 
                    tolerance=0.1, remove_text=True):
    """
    Crop all PDFs in a directory to specified square size.
    Only processes files that match the expected source size.
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    processed = 0
    skipped = 0
    errors = 0
    
    # Process all PDFs in directory
    for filename in os.listdir(input_dir):
        if filename.lower().endswith('.pdf'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, f"cropped_{filename}")
            
            try:
                # Verify size if requested
                if verify_size:
                    is_valid, width, height = verify_pdf_size(
                        input_path, expected_size_inches, expected_size_inches, tolerance
                    )
                    
                    if not is_valid:
                        print(f"⊗ Skipped {filename}: Size {width:.2f}\" × {height:.2f}\" "
                              f"(expected {expected_size_inches}\" × {expected_size_inches}\")")
                        skipped += 1
                        continue
                
                # Process the PDF
                crop_pdf_to_square(input_path, output_path, size_inches, remove_text)
                print(f"✓ Processed: {filename}")
                processed += 1
                
            except Exception as e:
                print(f"✗ Error processing {filename}: {e}")
                errors += 1
    
    # Summary
    print(f"\n{'='*50}")
    print(f"Batch processing complete!")
    print(f"  Processed: {processed}")
    print(f"  Skipped:   {skipped}")
    print(f"  Errors:    {errors}")
    print(f"{'='*50}")

# Usage example
if __name__ == "__main__":
    input_directory = "C:\projects\crop-QR\input"
    output_directory = "C:\projects\crop-QR\output"

    batch_crop_pdfs(
        input_directory, 
        output_directory, 
        size_inches=2.72,           # Output crop size
        verify_size=True,            # Verify source size before processing
        expected_size_inches=3.0,    # Expected source size (3" × 3")
        tolerance=0.1,               # Allow ±0.1" tolerance
        remove_text=True             # Remove text to avoid letter fragments
    )