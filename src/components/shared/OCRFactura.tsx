import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { useAppContext } from '@/contexts/AppContext';
import { Camera, Upload, Scan, DollarSign, Calendar, Building2, FileText, CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FacturaData {
  monto: number;
  fecha: string;
  proveedor: string;
  concepto: string;
}

const OCRFactura: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<FacturaData | null>(null);
  const [manual, setManual] = useState<FacturaData>({ monto: 0, fecha: new Date().toISOString().slice(0, 10), proveedor: '', concepto: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const { addTransaccion } = useAppContext();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const procesarOCR = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const worker = await createWorker('spa');
      const { data } = await worker.recognize(image);
      await worker.terminate();

      const texto = data.text;
      const montoMatch = texto.match(/TOTAL[:\s]*Q?\s?([\d,]+\.?\d*)/i)
        || texto.match(/([\d,]+\.?\d*)\s*$/m)
        || texto.match(/Q\s?([\d,]+\.?\d*)/);
      const fechaMatch = texto.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
      const lineas = texto.split('\n').filter(l => l.trim().length > 3);
      const proveedorMatch = lineas.find(l =>
        /^[A-ZÁÉÍÓÚÑ\s]{4,}$/.test(l.trim()) && l.trim().length > 5 && l.trim().length < 50
      );

      const extraido: FacturaData = {
        monto: montoMatch ? parseFloat(montoMatch[1].replace(/,/g, '')) : 0,
        fecha: fechaMatch ? fechaMatch[1] : new Date().toISOString().slice(0, 10),
        proveedor: proveedorMatch?.trim() || '',
        concepto: texto.slice(0, 120) || 'Factura escaneada',
      };

      setResult(extraido);
      setManual(extraido);
      toast.success('OCR completado');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Error al procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const guardarTransaccion = async () => {
    try {
      await addTransaccion({
        tipo: 'egreso',
        categoria: 'materiales',
        monto: manual.monto,
        fecha: manual.fecha,
        descripcion: `${manual.proveedor} - ${manual.concepto}`.slice(0, 200),
      });
      toast.success('Transacción creada desde factura');
      onClose?.();
    } catch { toast.error('Error al guardar'); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scan className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700">OCR Facturas</h3>
        </div>
        {onClose && <button onClick={onClose} className="p-0.5 rounded hover:bg-slate-100"><X className="w-3.5 h-3.5 text-slate-400" /></button>}
      </div>

      {!image ? (
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition btn-press">
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-semibold">Seleccionar imagen</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <img src={image} alt="Factura" className="w-full max-h-40 object-contain rounded-lg bg-slate-50" />
            <button onClick={() => { setImage(null); setResult(null); }}
              className="absolute top-1 right-1 bg-slate-800/70 text-white p-0.5 rounded"><X className="w-3 h-3" /></button>
          </div>

          {!result && (
            <button onClick={procesarOCR} disabled={processing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50 btn-press">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {processing ? 'Procesando...' : 'Escanear Factura'}
            </button>
          )}

          {result && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Monto</label>
                  <input type="number" value={manual.monto} onChange={e => setManual(p => ({ ...p, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded font-mono" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha</label>
                  <input type="date" value={manual.fecha} onChange={e => setManual(p => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border rounded" />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-semibold text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Proveedor</label>
                  <input value={manual.proveedor} onChange={e => setManual(p => ({ ...p, proveedor: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border rounded" />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-semibold text-slate-500 flex items-center gap-1"><FileText className="w-3 h-3" /> Concepto</label>
                  <input value={manual.concepto} onChange={e => setManual(p => ({ ...p, concepto: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border rounded" />
                </div>
              </div>

              <button onClick={guardarTransaccion}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold btn-press">
                <CheckCircle className="w-4 h-4" /> Crear Transacción
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRFactura;
