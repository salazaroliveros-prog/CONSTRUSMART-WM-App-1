import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { useAppContext } from '@/contexts/AppContext';
import { OcrService } from '@/services/ocr/OcrService';
import { Upload, Scan, DollarSign, Calendar, Building2, FileText, CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { Label } from '@/components/ui/label'; // Import Label for form elements

interface FacturaData {
  monto: number;
  fecha: string;
  proveedor: string;
  concepto: string;
  proyectoId?: string | null; // Add proyectoId to data
}

const OCRFactura: React.FC<{ onClose?: () => void; proyectoId?: string }> = ({ onClose, proyectoId }) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FacturaData | null>(null);
  const [manual, setManual] = useState<FacturaData>({ monto: 0, fecha: new Date().toISOString().slice(0, 10), proveedor: '', concepto: '', proyectoId: proyectoId || null });
  const fileRef = useRef<HTMLInputElement>(null);
  const { addTransaccion } = useAppContext(); // Still need addTransaccion if saving directly, but we'll change this

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!image) return;
    setProcessing(true);
    setResult(null); // Clear previous results
    try {
      const worker = await createWorker('spa'); // Spanish language
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();

      // Basic regex parsing - improve this significantly
      const numeroRegex = /total:?\s*q?\s*([\d,]+\.?\d{0,2})/i;
      const fechaRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
      const proveedorRegex = /^([A-Z\s]{5,50})$/m; // Uppercase text line

      let monto = 0;
      let fecha = '';
      let proveedor = '';
      
      const lines = text.split('\n');
      
      // Find monto
      for (const line of lines) {
        const match = line.match(numeroRegex);
        if (match && match[1]) {
           monto = parseFloat(match[1].replace(/,/g, ''));
           break;
        }
      }

      // Find fecha
      const fechaMatch = text.match(fechaRegex);
      if (fechaMatch && fechaMatch[1]) {
          fecha = fechaMatch[1].replace(/-/g, '/'); // Normalize separators
      }

      // Find proveedor (first all-caps line of reasonable length)
      for (const line of lines) {
        if (proveedorRegex.test(line)) {
          proveedor = line.trim();
          break;
        }
      }

      setResult({
        monto: monto > 0 ? monto : manual.monto, // Use parsed or manual input
        fecha: fecha || manual.fecha,
        proveedor: proveedor || manual.proveedor,
        concepto: lines?.[0]?.trim().substring(0, 120) || manual.concepto, // Use first line as concept
        proyectoId: manual.proyectoId // Keep selected project
      });
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Error al procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualChange = (field: keyof FacturaData, value: string | number) => {
    setManual(prev => ({ ...prev, [field]: value }));
    // If result is shown, update manual input to reflect changes
    if (result) {
      setResult(prev => prev ? { ...prev, [field]: value } : null);
    }
  };
  
  // MODIFIED: Save action now initiates OCR workflow
  const handleSave = async () => {
    const dataToSave = result || manual;
    if (!dataToSave.monto || !dataToSave.fecha || !dataToSave.proveedor) {
      toast.error('Por favor, completa los campos requeridos: Monto, Fecha y Proveedor.');
      return;
    }

    setSaving(true);
    try {
      // Upload document for OCR processing and direct saving (for now)
      // This part needs to change to trigger an approval workflow
      await OcrService.uploadDocument({
        proyecto_id: dataToSave.proyectoId || null,
        proveedor: dataToSave.proveedor,
        monto: dataToSave.monto,
        fecha_factura: dataToSave.fecha,
        // ocr_raw_text: result?.rawText, // Should be populated by OCR service if available
        // ocr_data: result?.structuredData, // Should be populated by OCR service
        // archivo_url: image // Store image URL if uploaded to storage
      });

      toast.success('Factura enviada para procesamiento.');
      onClose?.(); // Close modal after successful submission
    } catch (error) {
      console.error('Error saving OCR data:', error);
      toast.error('Error al guardar la factura.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border p-4 space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2 mb-3">Procesar Factura</h3>

      {/* Image Upload */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 cursor-pointer" onClick={() => fileRef.current?.click()}>
        {image ? (
          <img src={image} alt="Factura" className="max-h-60 rounded-lg" />
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Haz clic para subir la imagen de la factura</p>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} className="hidden" />
          </>
        )}
      </div>

      {/* Process Button */}
      <Button onClick={processImage} disabled={!image || processing || saving} className="w-full">
        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
        {processing ? 'Procesando...' : 'Escanear Factura'}
      </Button>

      {/* Result Display and Manual Input */}
      {(result || Object.values(manual).some(val => val !== '')) && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold border-b pb-1">Datos Extraídos / Manuales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* Proyecto Select */}
             <div>
                <Label htmlFor="proyectoId">Proyecto</Label>
                <Select 
                  value={manual.proyectoId || ''} 
                  onValueChange={(val) => handleManualChange('proyectoId', val)} 
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={manual.monto}
                onChange={e => handleManualChange('monto', parseFloat(e.target.value) || 0)}
                placeholder="1234.56"
                disabled={saving}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={manual.fecha}
                onChange={e => handleManualChange('fecha', e.target.value)}
                disabled={saving}
                className="mt-1"
              />
            </div>
             <div>
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                value={manual.proveedor}
                onChange={e => handleManualChange('proveedor', e.target.value)}
                placeholder="Nombre del Proveedor"
                disabled={saving}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="concepto">Concepto</Label>
            <Textarea
              id="concepto"
              value={manual.concepto}
              onChange={e => handleManualChange('concepto', e.target.value)}
              placeholder="Descripción del gasto"
              rows={3}
              disabled={saving}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving || (!result && !Object.values(manual).some(val => val !== ''))} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
        {saving ? 'Guardando...' : 'Guardar como Transacción (sin aprobación)'}
      </Button>
    </div>
  );
};

export default OCRFactura;
