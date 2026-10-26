@echo off
setlocal EnableDelayedExpansion

rem ghostscript executable name
set "ghostscript=gswin64c"

rem directories to scan for files
set "filesDir[0]=%~dp0"
set "filesDir[1]=FOLDER2"
set "filesDir[2]=FOLDER3"

rem extension of files to be scanned
set "ext=pdf"

rem new file be creation or input file overwrite
set "createNewPDFs=1"
rem file prefix for new files (if they should be created)
set "filepre=web_"

rem loop over all directories defined in filesDir array
for /f "tokens=2 delims==" %%d in ('set filesDir[') do (
   if exist "%%~d" (
      pushd "%%~d"
      rem loop over all files in all (sub)directories with given extension
      for /f "delims=*" %%f in ('dir "*.%ext%" /b /s /a:-d') do (
         if [%createNewPDFs%] EQU [1] (
		%ghostscript% -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -r150 -dNoOutputFonts -dWRITESYSTEMFONTS=false -dQUIET -dPDFSETTINGS=/screen -dColorImageDownsampleType=/Bicubic -dColorImageResolution=72 -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=72 -dMonoImageDownsampleType=/Bicubic -dMonoImageResolution=72 -sOutputFile="%%~dpf%filepre%%%~nxf" "%%~f"

         ) else (
            %ghostscript% -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -r150 -dNoOutputFonts -dWRITESYSTEMFONTS=false -dQUIET -sOutputFile="%%~dpf%filepre%%%~nxf" "%%f"
            for %%t in ("%TEMP%\%%~nxf") do ( set "newSize=%%~zt" )
            for %%t in ("%%~f") do ( set "oldSize=%%~zt" )
            if [!newSize!] LSS [!oldSize!] (
               rem new file is smaller --> overwrite
               move /y "%TEMP%\%%~nxf" "%%~f"
            ) else (
               rem new file is greater --> delete it of the temp dir
               del "%TEMP%\%%~nxf"
            )
         )
      )
      popd
   )
)