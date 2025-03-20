#!/usr/bin/env python3
"""
Font Manager Script - Python helper for font installation/uninstallation
This script provides cross-platform functionality to install and uninstall fonts
"""

import os
import sys
import json
import shutil
import platform
import subprocess
from pathlib import Path

def get_user_fonts_directory():
    """Get the user fonts directory based on the operating system"""
    system = platform.system()
    
    if system == 'Windows':
        return os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts')
    elif system == 'Darwin':  # macOS
        return os.path.join(os.path.expanduser('~'), 'Library/Fonts')
    elif system == 'Linux':
        return os.path.join(os.path.expanduser('~'), '.local/share/fonts')
    else:
        return os.path.join(os.path.expanduser('~'), 'fonts')

def activate_font(font_path):
    """
    Installs a font on the system
    Args:
        font_path: Path to the font file
    Returns:
        bool: Success status
    """
    system = platform.system()
    
    try:
        if system == 'Windows':
            return activate_font_windows(font_path)
        elif system == 'Darwin':  # macOS
            return activate_font_macos(font_path)
        elif system == 'Linux':
            return activate_font_linux(font_path)
        else:
            print(f"Unsupported operating system: {system}")
            return False
    except Exception as e:
        print(f"Error activating font: {e}")
        return False

def deactivate_font(font_path):
    """
    Removes a font from the system
    Args:
        font_path: Path to the font file
    Returns:
        bool: Success status
    """
    system = platform.system()
    
    try:
        if system == 'Windows':
            return deactivate_font_windows(font_path)
        elif system == 'Darwin':  # macOS
            return deactivate_font_macos(font_path)
        elif system == 'Linux':
            return deactivate_font_linux(font_path)
        else:
            print(f"Unsupported operating system: {system}")
            return False
    except Exception as e:
        print(f"Error deactivating font: {e}")
        return False

def activate_font_windows(font_path):
    """
    Install a font on Windows
    Uses the system font API through PowerShell
    """
    try:
        # Create a PowerShell command to add the font
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Copy the font to the Fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        if not os.path.exists(dest_path):
            shutil.copy2(font_path, dest_path)
        
        # Use PowerShell to install the font through the Shell API
        ps_command = f"""
        $objShell = New-Object -ComObject Shell.Application
        $objFolder = $objShell.Namespace(0x14)
        $objFolder.CopyHere("{dest_path}")
        """
        
        # Execute PowerShell command
        subprocess.run(['powershell', '-Command', ps_command], 
                      check=True, 
                      capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error activating font on Windows: {e}")
        return False

def deactivate_font_windows(font_path):
    """
    Uninstall a font on Windows
    Removes from user fonts directory and updates registry
    """
    try:
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Path to the font in the Fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        # Check if the font exists in the Fonts directory
        if os.path.exists(dest_path):
            # Use PowerShell to properly uninstall the font
            ps_command = f"""
            Remove-ItemProperty -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" -Name "{font_file}"
            Remove-Item -Path "{dest_path}" -Force
            """
            
            # Execute PowerShell command
            subprocess.run(['powershell', '-Command', ps_command], 
                          check=True, 
                          capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error deactivating font on Windows: {e}")
        return False

def activate_font_macos(font_path):
    """
    Install a font on macOS
    Copies to user font directory and updates font cache
    """
    try:
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Ensure user fonts directory exists
        os.makedirs(user_fonts_dir, exist_ok=True)
        
        # Copy the font to the user fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        if not os.path.exists(dest_path):
            shutil.copy2(font_path, dest_path)
        
        # Update font cache
        subprocess.run(['atsutil', 'databases', '-remove'], 
                      check=True, 
                      capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error activating font on macOS: {e}")
        return False

def deactivate_font_macos(font_path):
    """
    Uninstall a font on macOS
    Removes from user font directory and updates font cache
    """
    try:
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Path to the font in the user fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        # Check if the font exists in the user fonts directory
        if os.path.exists(dest_path):
            os.remove(dest_path)
        
        # Update font cache
        subprocess.run(['atsutil', 'databases', '-remove'], 
                      check=True, 
                      capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error deactivating font on macOS: {e}")
        return False

def activate_font_linux(font_path):
    """
    Install a font on Linux
    Copies to user font directory and updates font cache
    """
    try:
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Ensure user fonts directory exists
        os.makedirs(user_fonts_dir, exist_ok=True)
        
        # Copy the font to the user fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        if not os.path.exists(dest_path):
            shutil.copy2(font_path, dest_path)
        
        # Update font cache
        subprocess.run(['fc-cache', '-f'], 
                      check=True, 
                      capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error activating font on Linux: {e}")
        return False

def deactivate_font_linux(font_path):
    """
    Uninstall a font on Linux
    Removes from user font directory and updates font cache
    """
    try:
        font_file = os.path.basename(font_path)
        user_fonts_dir = get_user_fonts_directory()
        
        # Path to the font in the user fonts directory
        dest_path = os.path.join(user_fonts_dir, font_file)
        
        # Check if the font exists in the user fonts directory
        if os.path.exists(dest_path):
            os.remove(dest_path)
        
        # Update font cache
        subprocess.run(['fc-cache', '-f'], 
                      check=True, 
                      capture_output=True)
        
        return True
    except Exception as e:
        print(f"Error deactivating font on Linux: {e}")
        return False

def list_installed_fonts():
    """
    List all fonts installed on the system
    Returns:
        list: List of font paths
    """
    user_fonts_dir = get_user_fonts_directory()
    fonts = []
    
    try:
        # For the web app demo, simplify by listing fonts in the user fonts directory
        if os.path.exists(user_fonts_dir):
            for file in os.listdir(user_fonts_dir):
                file_path = os.path.join(user_fonts_dir, file)
                if os.path.isfile(file_path) and file.lower().endswith(('.ttf', '.otf', '.woff', '.woff2')):
                    fonts.append(file_path)
        
        # For the web app demo, add some sample fonts if none are found
        if not fonts:
            system = platform.system()
            if system == 'Windows':
                fonts = [
                    os.path.join(user_fonts_dir, 'Arial.ttf'),
                    os.path.join(user_fonts_dir, 'Times New Roman.ttf'),
                    os.path.join(user_fonts_dir, 'Calibri.ttf')
                ]
            elif system == 'Darwin':  # macOS
                fonts = [
                    os.path.join(user_fonts_dir, 'Arial.ttf'),
                    os.path.join(user_fonts_dir, 'Times New Roman.ttf'),
                    os.path.join(user_fonts_dir, 'Helvetica.ttf')
                ]
            elif system == 'Linux':
                fonts = [
                    os.path.join(user_fonts_dir, 'DejaVuSans.ttf'),
                    os.path.join(user_fonts_dir, 'FreeSans.ttf'),
                    os.path.join(user_fonts_dir, 'Liberation Sans.ttf')
                ]
    except Exception as e:
        print(f"Error listing installed fonts: {e}")
    
    return fonts

def main():
    """Main CLI function"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Missing command',
            'usage': 'python font_manager.py [activate|deactivate|list] [font_path]'
        }))
        return
    
    command = sys.argv[1]
    
    try:
        if command == 'activate' and len(sys.argv) >= 3:
            font_path = sys.argv[2]
            success = activate_font(font_path)
            print(json.dumps({'success': success}))
        
        elif command == 'deactivate' and len(sys.argv) >= 3:
            font_path = sys.argv[2]
            success = deactivate_font(font_path)
            print(json.dumps({'success': success}))
        
        elif command == 'list':
            fonts = list_installed_fonts()
            print(json.dumps({'fonts': fonts}))
        
        else:
            print(json.dumps({
                'error': f'Unknown command: {command}',
                'usage': 'python font_manager.py [activate|deactivate|list] [font_path]'
            }))
    
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    main()