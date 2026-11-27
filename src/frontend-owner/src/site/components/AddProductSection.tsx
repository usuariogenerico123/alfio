import { Download, ImagePlus, Plus, QrCode, Trash2 } from 'lucide-react'
import QRCode from 'qrcode'
import { useState } from 'react'
import type { CreateProductRequest, OwnerProduct, ProductSpec } from '../../api/types'
import { formatUsdc } from '../utils/formatters'

interface AddProductSectionProps {
  defaultStoreName: string
  onCreateProduct: (
    payload: CreateProductRequest,
  ) => Promise<{ product: OwnerProduct; productCode: string }>
}

export function AddProductSection({
  defaultStoreName,
  onCreateProduct,
}: AddProductSectionProps) {
  const [storeName, setStoreName] = useState(defaultStoreName)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [priceUsd, setPriceUsd] = useState('')
  const [stock, setStock] = useState('1')
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { label: 'Garantía', value: '6 meses' },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedResult, setGeneratedResult] = useState<{
    product: OwnerProduct
    productCode: string
    qrDataUrl: string
  } | null>(null)

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSpecChange = (index: number, field: 'label' | 'value', value: string) => {
    setSpecs((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const handleAddSpecRow = () => {
    setSpecs((prev) => [...prev, { label: '', value: '' }])
  }

  const handleRemoveSpecRow = (index: number) => {
    setSpecs((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedPrice = Number(priceUsd)
    const parsedStock = Number(stock)

    if (!storeName.trim() || !name.trim()) {
      setError('Ingresa el nombre de la tienda y del producto.')
      return
    }
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Ingresa un precio válido en USD mayor a 0.')
      return
    }
    if (Number.isNaN(parsedStock) || parsedStock < 1) {
      setError('Ingresa un stock válido (mínimo 1).')
      return
    }

    const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim())

    setIsSaving(true)
    try {
      const response = await onCreateProduct({
        storeName: storeName.trim(),
        name: name.trim(),
        photoUrl: photoUrl || undefined,
        description: description.trim() || 'Producto disponible a crédito con alFio.',
        specs: cleanSpecs,
        priceUsd: parsedPrice,
        stock: parsedStock,
      })

      const qrDataUrl = await QRCode.toDataURL(response.productCode, {
        width: 420,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      })

      setGeneratedResult({
        product: response.product,
        productCode: response.productCode,
        qrDataUrl,
      })

      setName('')
      setDescription('')
      setPhotoUrl('')
      setPriceUsd('')
      setStock('1')
      setSpecs([{ label: 'Garantía', value: '6 meses' }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQrToPhone = async () => {
    if (!generatedResult) return
    const filename = `qr-${generatedResult.product.qrCode.toLowerCase()}.png`

    try {
      if (navigator.share && navigator.canShare) {
        const res = await fetch(generatedResult.qrDataUrl)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `QR ${generatedResult.product.name}`,
            text: generatedResult.productCode,
            files: [file],
          })
          return
        }
      }
    } catch {
      // Si el usuario cancela o falla Web Share, hacemos descarga directa
    }

    const link = document.createElement('a')
    link.href = generatedResult.qrDataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section
      aria-labelledby="add-product-heading"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="floating-card rounded-2xl p-5 sm:p-6 lg:col-span-7 space-y-4"
      >
        <div>
          <h2
            id="add-product-heading"
            className="text-base font-semibold text-neutral-900"
          >
            Añadir producto
          </h2>
          <p className="text-xs text-neutral-500">
            Al guardar, el backend genera el código único del producto y creamos su QR listo para imprimir.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-store" className="block text-xs font-medium text-neutral-700">
              Tienda
            </label>
            <input
              id="prod-store"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prod-name" className="block text-xs font-medium text-neutral-700">
              Nombre del producto
            </label>
            <input
              id="prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Reloj Deportivo Pro"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="prod-desc" className="block text-xs font-medium text-neutral-700">
            Descripción corta
          </label>
          <input
            id="prod-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve resumen visible al escanear el QR"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="prod-photo" className="block text-xs font-medium text-neutral-700">
            Foto del producto
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <label
              htmlFor="prod-photo"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-yellow-400 hover:bg-yellow-50/40 cursor-pointer"
            >
              <ImagePlus className="h-4 w-4 text-yellow-600" />
              <span>{photoUrl ? 'Cambiar foto' : 'Subir foto'}</span>
            </label>
            <input
              id="prod-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Vista previa del producto"
                className="h-12 w-12 rounded-lg border border-neutral-200 object-cover"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="prod-price" className="block text-xs font-medium text-neutral-700">
              Precio (USD)
            </label>
            <input
              id="prod-price"
              type="number"
              min="1"
              step="0.01"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              placeholder="100.00"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 font-mono text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prod-stock" className="block text-xs font-medium text-neutral-700">
              Stock
            </label>
            <input
              id="prod-stock"
              type="number"
              min="1"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 font-mono text-sm text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">
              Especificaciones
            </span>
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          <div className="space-y-2">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={spec.label}
                  onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                  placeholder="Ej. Color"
                  className="w-1/2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  placeholder="Ej. Negro"
                  className="w-1/2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 focus:border-yellow-400 focus:bg-white focus:outline-none"
                />
                {specs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(idx)}
                    aria-label="Eliminar especificación"
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          id="btn-save-product"
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? 'Guardando y generando QR...' : 'Guardar producto y generar QR'}
        </button>
      </form>

      <div className="floating-card flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-5">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-yellow-500" />
            <h3 className="text-base font-semibold text-neutral-900">
              Código QR generado
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Se genera automáticamente con el código único que devuelve el backend.
          </p>
        </div>

        {generatedResult ? (
          <div className="my-5 flex flex-col items-center text-center">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
              <img
                src={generatedResult.qrDataUrl}
                alt={`QR de ${generatedResult.product.name}`}
                className="h-52 w-52"
              />
            </div>

            <p className="mt-3 text-sm font-bold text-neutral-900">
              {generatedResult.product.name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-neutral-600">
              {formatUsdc(generatedResult.product.totalPriceUsdc)} · Stock {generatedResult.product.stock}
            </p>
            <p className="mt-2 break-all rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-mono text-[11px] text-neutral-600">
              {generatedResult.productCode}
            </p>

            <button
              id="btn-save-qr-phone"
              type="button"
              onClick={() => void handleSaveQrToPhone()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 cursor-pointer"
            >
              <Download className="h-4 w-4 text-yellow-400" />
              <span>Guardar en teléfono</span>
            </button>
          </div>
        ) : (
          <div className="my-auto flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 px-4 py-12 text-center">
            <QrCode className="h-8 w-8 text-neutral-300" />
            <p className="mt-2 text-xs font-medium text-neutral-600">
              Guarda un producto para generar su QR
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Ejemplo de código: ALFIO-A1B2C3D4
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
