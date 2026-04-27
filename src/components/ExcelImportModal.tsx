import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { MeasurementUnit } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportPreview {
  sheetName: string;
  type: 'products' | 'customers' | 'suppliers' | 'unknown';
  count: number;
  data: any[];
  mappedCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { addProduct, addCustomer, addSupplier } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<ImportPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: number, errors: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const isSimilar = (str1: string, str2: string) => {
    return str1.toLowerCase().replace(/[^a-z0-9]/g, '') === str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const findColumn = (row: any, aliases: string[]) => {
    const keys = Object.keys(row);
    
    // First pass: look for exact or very similar match (stripping spaces/special chars)
    for (const alias of aliases) {
      const match = keys.find(k => isSimilar(k, alias));
      if (match && row[match] !== undefined && String(row[match]).trim() !== '') return row[match];
    }
    
    // Second pass: look for partial match (e.g., column "Preço de Venda" matches alias "preço")
    for (const alias of aliases) {
      const match = keys.find(k => {
        const cleanK = k.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const cleanAlias = alias.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        return cleanK.includes(cleanAlias) || cleanAlias.includes(cleanK);
      });
      if (match && row[match] !== undefined && String(row[match]).trim() !== '') return row[match];
    }
    
    return undefined;
  };

  const guessType = (sheetName: string, sampleRow: any): 'products' | 'customers' | 'suppliers' | 'unknown' => {
    const sName = sheetName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (sName.includes('prod') || sName.includes('artigo') || sName.includes('item') || sName.includes('stock') || sName.includes('estoque') || sName.includes('invent') || sName.includes('mercadori')) return 'products';
    if (sName.includes('client') || sName.includes('customer') || sName.includes('comprador')) return 'customers';
    if (sName.includes('fornec') || sName.includes('supplier') || sName.includes('vend') || sName.includes('parceir')) return 'suppliers';

    // Guess by columns
    const keys = Object.keys(sampleRow || {}).map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const hasPrice = keys.some(k => k.includes('pre') || k.includes('price') || k.includes('pvp') || k.includes('custo') || k.includes('cost') || k.includes('valor'));
    const hasStock = keys.some(k => k.includes('stock') || k.includes('estoqu') || k.includes('qtd') || k.includes('quant') || k.includes('saldo'));
    const hasSKU = keys.some(k => k.includes('sku') || k.includes('cod') || k.includes('ref'));
    
    const hasEmail = keys.some(k => k.includes('email') || k.includes('mail') || k.includes('contato') || k.includes('contacto'));
    const hasDoc = keys.some(k => k.includes('nuit') || k.includes('nif') || k.includes('cpf') || k.includes('cnpj') || k.includes('doc'));
    const hasCompany = keys.some(k => k.includes('empresa') || k.includes('razao') || k.includes('entidade'));

    if ((hasPrice || hasStock || hasSKU) && !hasCompany && !hasEmail) return 'products';
    if (hasEmail || hasDoc || hasCompany) {
        const isLikelySupplier = keys.some(k => k.includes('categoria') || k.includes('fornecedor'));
        return isLikelySupplier ? 'suppliers' : 'customers';
    }
    
    const hasName = keys.some(k => k.includes('nome') || k.includes('name') || k.includes('desc'));
    if (hasName) return 'products';
    
    return 'unknown';
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setImportResult(null);
    setPreviews([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const newPreviews: ImportPreview[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawData.length === 0) continue;

        const type = guessType(sheetName, rawData[0]);
        
        if (type !== 'unknown') {
          // Count how many we think we can map
          let mappedCount = 0;
          rawData.forEach((row: any) => {
            const name = findColumn(row, ['nome', 'name', 'desc', 'produto', 'cliente', 'fornecedor', 'razao social', 'artigo', 'item', 'mercadoria', 'empresa', 'entidade']);
            if (name) mappedCount++;
          });

          newPreviews.push({
            sheetName,
            type,
            count: rawData.length,
            data: rawData,
            mappedCount
          });
        }
      }

      setPreviews(newPreviews);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      alert('Erro ao ler o ficheiro Excel. Verifique o formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = async () => {
    setIsImporting(true);
    let success = 0;
    let errors = 0;

    for (const preview of previews) {
      if (preview.type === 'products') {
        for (const row of preview.data) {
          try {
            const name = findColumn(row, ['nome', 'name', 'descrição', 'descricao', 'produto', 'artigo', 'item', 'mercadoria']);
            if (!name) { errors++; continue; }

            const priceVal = findColumn(row, ['preço', 'preco', 'price', 'pvp', 'venda', 'valor']);
            const costVal = findColumn(row, ['custo', 'cost', 'compra', 'valor compra']);
            const stockVal = findColumn(row, ['stock', 'estoque', 'quantidade', 'qtd', 'quant', 'saldo']);
            const skuVal = findColumn(row, ['sku', 'codigo', 'código', 'code', 'ref', 'referencia', 'referência']);
            const catVal = findColumn(row, ['categoria', 'category', 'grupo', 'familia', 'família', 'tipo', 'classificacao', 'classificação']);

            await addProduct({
              name: String(name),
              price: Number(priceVal) || 0,
              cost: Number(costVal) || 0,
              stock: Number(stockVal) || 0,
              minStock: 5,
              category: catVal ? String(catVal) : 'Geral',
              sku: skuVal ? String(skuVal) : `PROD-${Math.floor(Math.random() * 10000)}`,
              unit: 'un' as MeasurementUnit
            });
            success++;
          } catch (e) {
            errors++;
          }
        }
      } else if (preview.type === 'customers') {
        for (const row of preview.data) {
          try {
            const name = findColumn(row, ['nome', 'name', 'cliente', 'razao social', 'razão social', 'empresa', 'entidade']);
            if (!name) { errors++; continue; }

            const email = findColumn(row, ['email', 'e-mail', 'mail', 'correio', 'contato', 'contacto']);
            const doc = findColumn(row, ['documento', 'nuit', 'nif', 'cpf', 'cnpj', 'doc', 'bi', 'identificacao', 'identificação']);

            await addCustomer({
              name: String(name),
              email: email ? String(email) : '',
              document: doc ? String(doc) : '',
              status: 'Ativo'
            });
            success++;
          } catch (e) {
            errors++;
          }
        }
      } else if (preview.type === 'suppliers') {
        for (const row of preview.data) {
          try {
            const name = findColumn(row, ['nome', 'name', 'fornecedor', 'razao social', 'razão social', 'empresa', 'entidade']);
            if (!name) { errors++; continue; }

            const email = findColumn(row, ['email', 'e-mail', 'mail', 'correio', 'contato', 'contacto']);
            const doc = findColumn(row, ['documento', 'nuit', 'nif', 'cpf', 'cnpj', 'doc', 'bi', 'identificacao', 'identificação']);
            const cat = findColumn(row, ['categoria', 'category', 'tipo', 'segmento', 'ramo']);

            await addSupplier({
              name: String(name),
              email: email ? String(email) : '',
              document: doc ? String(doc) : '',
              category: cat ? String(cat) : 'Geral'
            });
            success++;
          } catch (e) {
            errors++;
          }
        }
      }
    }

    setImportResult({ success, errors });
    setIsImporting(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'products': return 'Produtos';
      case 'customers': return 'Clientes';
      case 'suppliers': return 'Fornecedores';
      default: return 'Desconhecido';
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'products': return 'inventory_2';
      case 'customers': return 'group';
      case 'suppliers': return 'local_shipping';
      default: return 'help';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none focus:outline-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-surface-container border border-outline-variant/30 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-headline text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              Importar Dados do Excel
            </h3>
            <button 
              onClick={onClose}
              disabled={isImporting}
              className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-error/10 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {!file && !importResult && (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center cursor-pointer hover:bg-primary/5 transition-colors group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileSelect}
              />
              <span className="material-symbols-outlined text-5xl text-primary mb-4 group-hover:scale-110 transition-transform">cloud_upload</span>
              <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Clique ou arraste um ficheiro Excel aqui</h4>
              <p className="text-sm text-slate-500">O sistema irá identificar automaticamente Produtos, Clientes ou Fornecedores baseando-se no nome das abas e colunas (ex: xlsx, xls, csv).</p>
            </div>
          )}

          {isProcessing && (
            <div className="py-12 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">Analisando ficheiro...</p>
            </div>
          )}

          {file && !isProcessing && !importResult && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-xl">
                <span className="material-symbols-outlined">description</span>
                <span className="font-medium">{file.name}</span>
                <button 
                  onClick={() => { setFile(null); setPreviews([]); }}
                  className="ml-auto text-sm underline hover:opacity-80"
                >
                  Trocar ficheiro
                </button>
              </div>

              {previews.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Encontrado no ficheiro:</h4>
                  {previews.map((preview, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant/20 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">{getTargetIcon(preview.type)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-800 dark:text-slate-200">Aba: {preview.sheetName}</p>
                          <p className="text-xs text-slate-500">Detectado como <strong className="text-primary">{getTypeLabel(preview.type)}</strong></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{preview.count}</p>
                        <p className="text-[10px] text-slate-400">linhas</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl text-sm flex gap-3 text-justify">
                    <span className="material-symbols-outlined text-secondary">info</span>
                    <p>Ao confirmar, o sistema irá importar todos os registros válidos. Atenção para não importar listas duplicadas caso já existam no sistema.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-error-container text-on-error-container rounded-xl">
                  <span className="material-symbols-outlined text-4xl mb-2">error</span>
                  <p>Não foi possível identificar dados compatíveis com Produtos, Clientes ou Fornecedores nas abas deste ficheiro Excel.</p>
                  <p className="text-sm mt-2 opacity-80">Experimente verificar os nomes das colunas (Nome, Preço, Custo, Categoria, Cliente, Fornecedor).</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  onClick={onClose}
                  disabled={isImporting}
                  className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                {previews.length > 0 && (
                  <button
                    onClick={executeImport}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md shadow-primary/20"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Importando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                        Confirmar e Importar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {importResult && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Importação Concluída</h4>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                <strong>{importResult.success}</strong> registos foram importados com sucesso.
                {importResult.errors > 0 && (
                  <span className="text-error block mt-1">({importResult.errors} registos não puderam ser importados por estarem incompletos)</span>
                )}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-2 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                Concluir
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
