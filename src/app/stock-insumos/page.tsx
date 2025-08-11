'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AudioRecorderSimple from '@/components/AudioRecorderSimple';

interface Insumo {
  id: string;
  fields: {
    ID?: string;
    nombre?: string;
    categoria_insumo?: string;
    unidad_medida?: string;
    'Unidad Ingresa Insumo'?: string;
    'Cantidad Presentacion Insumo'?: number;
    descripcion?: string;
    'Rango Minimo Stock'?: number;
    estado?: string;
    'Total Cantidad Producto'?: number;
    'Total Insumo Unidades'?: number;
    'Total Insumo Granel'?: number;
    'cantidad Entrada Insumos'?: number[];
    'cantidad Salida Insumos'?: number[];
    'ID_Entrada Insumos'?: string[];
    'Salida Insumos'?: string[];
  };
}

const StockInsumosPage = () => {
  const { user } = useAuth();
  
  // Estados principales
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [searchText, setSearchText] = useState('');
  
  // Estados para formularios
  const [showNewInsumoForm, setShowNewInsumoForm] = useState(false);
  const [showDescontarStockForm, setShowDescontarStockForm] = useState(false);
  const [showRecibirPedidoForm, setShowRecibirPedidoForm] = useState(false);
  
  // Formulario nuevo insumo
  const [newInsumoData, setNewInsumoData] = useState({
    nombre: '',
    categoria_insumo: 'Materiales y Suministros Generales',
    unidad_medida: 'Unidad (Und)',
    descripcion: '',
    rangoMinimoStock: 10,
    estado: 'Disponible'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Formularios para operaciones de stock (independientes)
  const [descontarData, setDescontarData] = useState({
    insumoId: '',
    cantidad: 0,
    motivo: '',
    observaciones: ''
  });

  const [recibirData, setRecibirData] = useState({
    insumos: [{
      insumoId: '',
      cantidadIngresaUnidades: '',
      fechaVencimiento: ''
    }]
  });

  // Estados para búsqueda en dropdowns
  const [searchInsumo, setSearchInsumo] = useState<{[key: number]: string}>({});
  const [dropdownOpen, setDropdownOpen] = useState<{[key: number]: boolean}>({});

  // Cantidades específicas por insumo (ya no se usa, eliminar)
  // const [cantidadesPorInsumo, setCantidadesPorInsumo] = useState<{[key: string]: number}>({});

  // Categorías disponibles basadas en los datos reales de Airtable
  // Categorías exactas de Airtable
  const categorias = [
    "Materiales y Suministros Generales",
    "Reactivos y Químicos", 
    "Equipo de Protección Personal",
    "Productos de Limpieza y Desinfección",
    "Equipos y Herramientas",
    "Material de Laboratorio",
    "Contenedores y Almacenamiento",
    "Equipos de Laboratorio"
  ];

  // Categorías que se muestran por defecto (elementos básicos de laboratorio y EPPs)
  const categoriasBasicas = [
    "Materiales y Suministros Generales", 
    "Equipo de Protección Personal"
  ];

  // Unidades de medida exactas de Airtable
  const unidadesMedida = [
    "Unidad (Und)", 
    "Gramos (Gr)", 
    "Mililitros (Ml)"
  ];

  // Cargar datos al iniciar
  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      console.log('🔍 STOCK-INSUMOS: Iniciando fetch de insumos...');
      const response = await fetch('/api/stock-insumos');
      
      console.log('📡 STOCK-INSUMOS: Response status:', response.status);
      
      if (!response.ok) throw new Error('Error al cargar insumos');
      
      const data = await response.json();
      console.log('📋 STOCK-INSUMOS: Data recibida:', data);
      
      if (data.success && data.insumos) {
        console.log('✅ STOCK-INSUMOS: Insumos cargados:', data.insumos.length);
        setInsumos(data.insumos);
      } else {
        console.error('❌ STOCK-INSUMOS: Error en data:', data);
        setInsumos([]);
      }
    } catch (error) {
      console.error('❌ STOCK-INSUMOS: Error:', error);
      setError('Error al cargar los insumos');
      setInsumos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('📝 STOCK-INSUMOS: Creando insumo con datos:', newInsumoData);
      
      const response = await fetch('/api/stock-insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInsumoData),
      });

      const data = await response.json();
      console.log('📋 STOCK-INSUMOS: Response de creación:', data);

      if (data.success) {
        setSubmitStatus('success');
        setNewInsumoData({
          nombre: '',
          categoria_insumo: 'Materiales y Suministros Generales',
          unidad_medida: 'Unidad (Und)',
          descripcion: '',
          rangoMinimoStock: 10,
          estado: 'Disponible'
        });
        setShowNewInsumoForm(false);
        fetchInsumos(); // Recargar la lista
      } else {
        setSubmitStatus('error');
        console.error('Error al crear insumo:', data.error);
        console.error('Detalles del error:', data.details);
        alert(`Error al crear insumo: ${data.error}${data.details ? '\nDetalles: ' + data.details : ''}`);
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error de red o procesamiento:', error);
      alert(`Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDescontarStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descontarData.insumoId || descontarData.cantidad <= 0) return;

    // Solicitar confirmación antes de proceder
    const confirmacion = window.confirm(
      `¿Está seguro de descontar ${descontarData.cantidad} unidades del insumo seleccionado?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('📤 STOCK-INSUMOS: Descontando stock:', descontarData);
      
      const response = await fetch('/api/stock-insumos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: descontarData.insumoId,
          operacion: 'descontar',
          cantidad: descontarData.cantidad,
          motivo: descontarData.motivo,
          observaciones: descontarData.observaciones
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitStatus('success');
        setDescontarData({ 
          insumoId: '',
          cantidad: 0,
          motivo: '', 
          observaciones: '' 
        });
        setShowDescontarStockForm(false);
        fetchInsumos(); // Recargar la lista
      } else {
        console.error('Error al descontar stock:', data.error);
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecibirPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay al menos un insumo válido
    const insumosValidos = recibirData.insumos.filter(
      insumo => insumo.insumoId && insumo.cantidadIngresaUnidades && Number(insumo.cantidadIngresaUnidades) > 0
    );
    
    if (insumosValidos.length === 0) {
      alert('Debe agregar al menos un insumo con cantidad válida');
      return;
    }

    // Validar que todos los insumos seleccionados existen
    const insumosNoEncontrados = insumosValidos.filter(insumo => 
      !insumos.find(ins => ins.id === insumo.insumoId)
    );
    
    if (insumosNoEncontrados.length > 0) {
      alert('Hay insumos seleccionados que no son válidos. Por favor, seleccione insumos de la lista.');
      return;
    }

    // Solicitar confirmación antes de proceder
    const confirmacion = window.confirm(
      `¿Está seguro de recibir este pedido con ${insumosValidos.length} insumo(s)?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('📥 STOCK-INSUMOS: Recibiendo pedido:', recibirData);
      console.log('📥 STOCK-INSUMOS: Usuario actual:', user);
      
      const response = await fetch('/api/entrada-insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: insumosValidos.map(insumo => ({
            fields: {
              'Insumos Laboratorio': [insumo.insumoId],
              'Cantidad Ingresa Unidades': Number(insumo.cantidadIngresaUnidades),
              'Realiza Registro': user?.nombre || 'Usuario no identificado',
              ...(insumo.fechaVencimiento && { 'fecha_vencimiento': insumo.fechaVencimiento })
            }
          }))
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitStatus('success');
        setRecibirData({ 
          insumos: [{
            insumoId: '',
            cantidadIngresaUnidades: '',
            fechaVencimiento: ''
          }]
        });
        setSearchInsumo({});
        setDropdownOpen({});
        setShowRecibirPedidoForm(false);
        fetchInsumos(); // Recargar la lista
      } else {
        console.error('Error al recibir pedido:', data.error);
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarRecibirPedido = () => {
    const confirmacion = window.confirm(
      '¿Está seguro de cancelar el formulario de recibir pedido?\n\nSe perderán todos los datos ingresados.'
    );

    if (confirmacion) {
      setRecibirData({ 
        insumos: [{
          insumoId: '',
          cantidadIngresaUnidades: '',
          fechaVencimiento: ''
        }]
      });
      setSearchInsumo({});
      setDropdownOpen({});
      setShowRecibirPedidoForm(false);
    }
  };

  const handleCancelarDescontarStock = () => {
    const confirmacion = window.confirm(
      '¿Está seguro de cancelar el formulario de descuento?\n\nSe perderán todos los datos ingresados.'
    );

    if (confirmacion) {
      setDescontarData({ 
        insumoId: '',
        cantidad: 0,
        motivo: '', 
        observaciones: '' 
      });
      setShowDescontarStockForm(false);
    }
  };

  // Función para filtrar insumos en el dropdown
  const filtrarInsumos = (searchTerm: string) => {
    if (!searchTerm) return insumos;
    
    return insumos.filter(insumo => {
      const hasName = insumo.fields.nombre && insumo.fields.nombre.trim();
      const nombre = hasName ? insumo.fields.nombre : `Sin nombre - ${insumo.id.slice(-6)}`;
      const unidad = insumo.fields['Unidad Ingresa Insumo'] || insumo.fields.unidad_medida || 'unidad';
      
      return (nombre && nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
             unidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (insumo.fields.categoria_insumo && insumo.fields.categoria_insumo.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  };

  const categoriasUnicas = Array.from(
    new Set(insumos.map(insumo => insumo.fields.categoria_insumo || 'Sin categoría'))
  ).sort();

  // Filtrar insumos por categoría y búsqueda
  const insumosFiltrados = insumos.filter(insumo => {
    // Filtro por categoría
    let pasaFiltroCategoria = true;
    
    if (filtroCategoria === 'todos') {
      // Si es "todos", mostrar solo categorías básicas por defecto
      pasaFiltroCategoria = categoriasBasicas.includes(insumo.fields.categoria_insumo || '');
    } else if (filtroCategoria === 'ver-todas') {
      // Si es "ver-todas", mostrar todos los insumos
      pasaFiltroCategoria = true;
    } else {
      // Si hay una categoría específica seleccionada, mostrar solo esa
      pasaFiltroCategoria = insumo.fields.categoria_insumo === filtroCategoria;
    }
    
    // Filtro por búsqueda de texto
    const pasaFiltroBusqueda = !searchText || 
      (insumo.fields.nombre && insumo.fields.nombre.toLowerCase().includes(searchText.toLowerCase())) ||
      (insumo.fields.categoria_insumo && insumo.fields.categoria_insumo.toLowerCase().includes(searchText.toLowerCase())) ||
      (insumo.fields.unidad_medida && insumo.fields.unidad_medida.toLowerCase().includes(searchText.toLowerCase())) ||
      (insumo.fields.descripcion && typeof insumo.fields.descripcion === 'string' && insumo.fields.descripcion.toLowerCase().includes(searchText.toLowerCase()));
    
    return pasaFiltroCategoria && pasaFiltroBusqueda;
  });

  // Manejar transcripción de voz
  const handleVoiceTranscription = (text: string) => {
    setSearchText(text);
  };

  // Calcular estadísticas
  const stats = {
    total: insumos.length,
    conNombre: insumos.filter(insumo => insumo.fields.nombre && insumo.fields.nombre.trim()).length,
    sinConfigurar: insumos.filter(insumo => !insumo.fields.nombre || !insumo.fields.nombre.trim()).length,
    disponibles: insumos.filter(insumo => insumo.fields.estado === 'Disponible').length,
    agotados: insumos.filter(insumo => insumo.fields.estado === 'Agotado').length
  };

  return (
    <>
      <Navbar />
      <div 
        className="min-h-screen relative pt-24"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://res.cloudinary.com/dvnuttrox/image/upload/v1752168289/Lab_banner_xhhlfe.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white relative overflow-hidden">
                <div className="relative z-10 text-center">
                  <h1 className="text-3xl font-bold mb-2">📦 STOCK DE INSUMOS</h1>
                  <p className="text-xl opacity-90">Gestión y Control de Inventario de Laboratorio</p>
                </div>
              </div>
            </div>

            {/* Filtros y controles */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex flex-col gap-6">
                
                {/* Barra de búsqueda con micrófono */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Buscar insumos por nombre, categoría, unidad o descripción... 🎤"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-500"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <AudioRecorderSimple
                        onTranscriptionComplete={handleVoiceTranscription}
                        currentText={searchText}
                        onTextChange={setSearchText}
                      />
                    </div>
                  </div>
                  
                  {searchText && (
                    <button
                      onClick={() => setSearchText('')}
                      className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Filtros por categoría */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFiltroCategoria('todos')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filtroCategoria === 'todos'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Básicos ({insumos.filter(i => categoriasBasicas.includes(i.fields.categoria_insumo || '')).length})
                  </button>
                  
                  <button
                    onClick={() => setFiltroCategoria('ver-todas')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filtroCategoria === 'ver-todas'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Ver Todas ({insumos.length})
                  </button>
                  
                  {categoriasUnicas.map((categoria) => {
                    const count = insumos.filter(i => i.fields.categoria_insumo === categoria).length;
                    return (
                      <button
                        key={categoria}
                        onClick={() => setFiltroCategoria(categoria)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                          filtroCategoria === categoria
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {categoria} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Barra de acciones profesionales */}
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Operaciones de Inventario</h2>
                  
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>💡 Instrucción:</strong> Usa estos botones para gestionar tu inventario. Los formularios incluyen selectores para elegir insumos específicos.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowNewInsumoForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Registrar Insumo Nuevo</span>
                    </button>
                    
                    <button
                      onClick={() => setShowDescontarStockForm(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>📤</span>
                      <span>Descontar de Inventario</span>
                    </button>
                    
                    <button
                      onClick={() => setShowRecibirPedidoForm(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>📥</span>
                      <span>Recibir Pedidos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Cargando insumos...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                ❌ {error}
                <button 
                  onClick={fetchInsumos}
                  className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Lista de Insumos */}
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 p-2 rounded-lg text-2xl">📦</span>
                    <div>
                      <h2 className="text-2xl font-bold">Inventario de Insumos ({insumosFiltrados.length})</h2>
                      <p className="opacity-90">
                        {filtroCategoria === 'todos' ? 'Insumos básicos de laboratorio' : 
                         filtroCategoria === 'ver-todas' ? 'Todos los insumos' : 
                         `Categoría: ${filtroCategoria}`}
                      </p>
                    </div>
                  </div>
                </div>
              
              <div className="p-6">
                {/* Información de resultados */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {insumosFiltrados.length} de {insumos.length} insumos
                    {searchText && (
                      <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        Filtrado por: &quot;{searchText}&quot;
                      </span>
                    )}
                  </div>
                </div>

                {insumosFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">
                      {searchText ? '�' : '�📭'}
                    </div>
                    <p className="text-lg mb-2">
                      {searchText ? 'No se encontraron insumos' : 'No hay insumos registrados'}
                    </p>
                    {searchText ? (
                      <p className="text-sm text-gray-400 mb-4">
                        Intenta con otros términos de búsqueda
                      </p>
                    ) : null}
                    <button
                      onClick={() => {
                        if (searchText) {
                          setSearchText('');
                        } else {
                          setShowNewInsumoForm(true);
                        }
                      }}
                      className="mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                    >
                      {searchText ? 'Limpiar Búsqueda' : 'Agregar Primer Insumo'}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Insumo</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Unidad Presentación</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Cantidad Presentación</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Unidades</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Granel</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Stock Mínimo</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumosFiltrados.map((insumo, index) => {
                          const hasName = insumo.fields.nombre && insumo.fields.nombre.trim();
                          const totalCantidad = insumo.fields['Total Cantidad Producto'] || 0;
                          const totalUnidades = insumo.fields['Total Insumo Unidades'] || 0;
                          const totalGranel = insumo.fields['Total Insumo Granel'] || 0;
                          const cantidadPresentacion = insumo.fields['Cantidad Presentacion Insumo'] || 0;
                          const rangoMinimo = insumo.fields['Rango Minimo Stock'] || 0;
                          const estado = insumo.fields.estado || 'Disponible';
                          
                          // Lógica corregida de estados basada en Total Insumo Unidades:
                          // - Agotado: totalUnidades = 0
                          // - Poco Stock: 0 < totalUnidades < mínimo
                          // - Disponible: totalUnidades >= mínimo
                          const esAgotado = totalUnidades === 0;
                          const esPocoStock = totalUnidades > 0 && totalUnidades < rangoMinimo;
                          const esDisponible = totalUnidades >= rangoMinimo;
                          
                          return (
                            <tr 
                              key={insumo.id}
                              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                              } ${
                                !hasName ? 'bg-yellow-25 hover:bg-yellow-50' : 
                                esAgotado ? 'bg-red-25 hover:bg-red-50' :
                                esPocoStock ? 'bg-orange-25 hover:bg-orange-50' : ''
                              }`}
                            >
                              {/* Nombre del insumo */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">
                                    {hasName ? insumo.fields.nombre : `Sin nombre - ID: ${insumo.id.slice(-6)}`}
                                  </span>
                                  {insumo.fields.descripcion && typeof insumo.fields.descripcion === 'string' && (
                                    <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      {insumo.fields.descripcion}
                                    </span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Categoría */}
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {insumo.fields.categoria_insumo || 'Sin categoría'}
                                </span>
                              </td>
                              
                              {/* Unidad Presentación */}
                              <td className="py-3 px-4 text-gray-700">
                                <span className="text-sm">
                                  {insumo.fields['Unidad Ingresa Insumo'] || insumo.fields.unidad_medida || 'Sin unidad'}
                                </span>
                              </td>
                              
                              {/* Cantidad Presentación */}
                              <td className="py-3 px-4 text-center">
                                <span className="font-medium text-gray-800">
                                  {cantidadPresentacion}
                                </span>
                              </td>
                              
                              {/* Total Unidades */}
                              <td className="py-3 px-4 text-center">
                                <span className={`font-bold text-lg ${
                                  esAgotado ? 'text-red-600' :
                                  esPocoStock ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {totalUnidades}
                                </span>
                              </td>
                              
                              {/* Total Granel */}
                              <td className="py-3 px-4 text-center">
                                <span className="font-medium text-gray-700">
                                  {totalGranel}
                                </span>
                                <div className="text-xs text-gray-500">gr/ml</div>
                              </td>
                              
                              {/* Stock Mínimo */}
                              <td className="py-3 px-4 text-center text-gray-600">
                                {rangoMinimo}
                              </td>
                              
                              {/* Estado */}
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  esAgotado ? 'bg-red-100 text-red-800' :
                                  esPocoStock ? 'bg-orange-100 text-orange-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {esAgotado ? '🔴 Agotado' :
                                   esPocoStock ? '🟡 Poco Stock' : '🟢 Disponible'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de recarga */}
            <div className="max-w-7xl mx-auto text-center mt-8">
              <button
                onClick={fetchInsumos}
                disabled={loading}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : '🔄 Actualizar Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear nuevo insumo */}
      {showNewInsumoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <span className="text-3xl">📦</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Agregar Nuevo Insumo</h2>
                  <p className="text-green-100 mt-1">Complete la información del insumo a registrar</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleCreateInsumo} className="p-8 space-y-6">
              {/* Nombre del insumo */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  <span className="flex items-center space-x-2">
                    <span>🏷️</span>
                    <span>Nombre del Insumo</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={newInsumoData.nombre}
                  onChange={(e) => setNewInsumoData({...newInsumoData, nombre: e.target.value})}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Ej: Agua destilada 1L, Guantes de nitrilo, etc."
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  <span className="flex items-center space-x-2">
                    <span>📂</span>
                    <span>Categoría</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  required
                  value={newInsumoData.categoria_insumo}
                  onChange={(e) => setNewInsumoData({...newInsumoData, categoria_insumo: e.target.value})}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              {/* Unidad de medida */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  <span className="flex items-center space-x-2">
                    <span>⚖️</span>
                    <span>Unidad de Medida</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  required
                  value={newInsumoData.unidad_medida}
                  onChange={(e) => setNewInsumoData({...newInsumoData, unidad_medida: e.target.value})}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  {unidadesMedida.map(unidad => (
                    <option key={unidad} value={unidad}>{unidad}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  <span className="flex items-center space-x-2">
                    <span>📝</span>
                    <span>Descripción</span>
                    <span className="text-gray-400">(Opcional)</span>
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={newInsumoData.descripcion}
                    onChange={(e) => setNewInsumoData({...newInsumoData, descripcion: e.target.value})}
                    className="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Descripción detallada del insumo, especificaciones, uso, etc."
                  />
                  <div className="absolute top-3 right-3">
                    <AudioRecorderSimple
                      currentText={newInsumoData.descripcion || ''}
                      onTextChange={(text) => setNewInsumoData({...newInsumoData, descripcion: text})}
                      onTranscriptionComplete={(text) => {
                        // Si ya hay texto, agregar al final
                        const currentText = newInsumoData.descripcion || '';
                        const newText = currentText ? `${currentText} ${text}` : text;
                        setNewInsumoData({...newInsumoData, descripcion: newText});
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock mínimo */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  <span className="flex items-center space-x-2">
                    <span>📊</span>
                    <span>Stock Mínimo</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newInsumoData.rangoMinimoStock}
                  onChange={(e) => setNewInsumoData({...newInsumoData, rangoMinimoStock: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Ej: 10"
                />
                <p className="text-gray-600 text-sm mt-2">
                  Cantidad mínima antes de mostrar alerta de poco stock
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewInsumoForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-lg text-lg font-semibold transition-all duration-200 border-2 border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg text-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="animate-spin">⏳</span>
                      <span>Creando...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>📦</span>
                      <span>Crear Insumo</span>
                    </span>
                  )}
                </button>
              </div>
              
              {/* Mensajes de estado */}
              {submitStatus === 'success' && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-lg flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold">¡Insumo creado exitosamente!</p>
                    <p className="text-sm">El insumo ha sido agregado al inventario.</p>
                  </div>
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-center space-x-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold">Error al crear el insumo</p>
                    <p className="text-sm">Por favor, revise los datos e intente nuevamente.</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal para descontar de inventario */}
      {showDescontarStockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">📤 Descontar de Inventario</h2>
              </div>
            </div>
            
            <form onSubmit={handleDescontarStock} className="p-6 space-y-6">
              {/* Información del descuento */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <span>📤</span>
                    <span>Información del Descuento</span>
                  </h3>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de insumo */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Insumo *
                      </label>
                      <select
                        value={descontarData.insumoId}
                        onChange={(e) => setDescontarData({...descontarData, insumoId: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-700"
                        required
                      >
                        <option value="">Seleccionar insumo</option>
                        {insumos.map(insumo => {
                          const hasName = insumo.fields.nombre && insumo.fields.nombre.trim();
                          const totalUnidades = insumo.fields['Total Insumo Unidades'] || 0;
                          const unidadPresentacion = insumo.fields['Unidad Ingresa Insumo'] || insumo.fields.unidad_medida || 'unidad';
                          return (
                            <option key={insumo.id} value={insumo.id}>
                              {hasName ? insumo.fields.nombre : `Sin nombre - ${insumo.id.slice(-6)}`} 
                              (Stock: {totalUnidades} {unidadPresentacion})
                            </option>
                          );
                        })}
                      </select>
                      
                      {/* Mostrar información del insumo seleccionado */}
                      {descontarData.insumoId && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800 flex items-center space-x-2">
                            <span>📏</span>
                            <span>
                              <strong>Unidad:</strong> {
                                insumos.find(ins => ins.id === descontarData.insumoId)?.fields['Unidad Ingresa Insumo'] ||
                                insumos.find(ins => ins.id === descontarData.insumoId)?.fields.unidad_medida || 
                                'Sin unidad'
                              }
                            </span>
                          </p>
                          <p className="text-sm text-orange-800 flex items-center space-x-2 mt-1">
                            <span>📊</span>
                            <span>
                              <strong>Stock Actual:</strong> {
                                insumos.find(ins => ins.id === descontarData.insumoId)?.fields['Total Insumo Unidades'] || 0
                              } unidades
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cantidad a descontar */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Cantidad a descontar *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={descontarData.cantidad}
                        onChange={(e) => setDescontarData({...descontarData, cantidad: Number(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-700"
                        placeholder={
                          descontarData.insumoId 
                            ? `Cantidad en ${
                                insumos.find(ins => ins.id === descontarData.insumoId)?.fields['Unidad Ingresa Insumo'] ||
                                insumos.find(ins => ins.id === descontarData.insumoId)?.fields.unidad_medida || 
                                'unidades'
                              }`
                            : "Cantidad a descontar"
                        }
                        required
                      />
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Motivo *
                      </label>
                      <select
                        value={descontarData.motivo}
                        onChange={(e) => setDescontarData({...descontarData, motivo: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-700"
                        required
                      >
                        <option value="">Seleccionar motivo</option>
                        <option value="Uso en laboratorio">Uso en laboratorio</option>
                        <option value="Vencimiento">Vencimiento</option>
                        <option value="Daño/Pérdida">Daño/Pérdida</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    {/* Observaciones */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={descontarData.observaciones}
                        onChange={(e) => setDescontarData({...descontarData, observaciones: e.target.value})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-700"
                        rows={3}
                        placeholder="Detalles adicionales sobre el descuento..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Descontando...' : 'Descontar Stock'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelarDescontarStock}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para recibir pedidos */}
      {showRecibirPedidoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">📥 Recibir Pedido</h2>
              </div>
            </div>
            
            <form onSubmit={handleRecibirPedido} className="p-6 space-y-6">
              {/* Lista de Insumos */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <span>📦</span>
                    <span>Insumos a Recibir ({recibirData.insumos.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newIndex = recibirData.insumos.length;
                      setRecibirData({
                        ...recibirData,
                        insumos: [
                          ...recibirData.insumos,
                          {
                            insumoId: '',
                            cantidadIngresaUnidades: '',
                            fechaVencimiento: ''
                          }
                        ]
                      });
                      // Inicializar estados de búsqueda para el nuevo insumo
                      setSearchInsumo({...searchInsumo, [newIndex]: ''});
                      setDropdownOpen({...dropdownOpen, [newIndex]: false});
                    }}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span>➕</span>
                    <span>Agregar Insumo</span>
                  </button>
                </div>

                {recibirData.insumos.map((insumo, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Insumo #{index + 1}</h4>
                      {recibirData.insumos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nuevosInsumos = recibirData.insumos.filter((_, i) => i !== index);
                            setRecibirData({ ...recibirData, insumos: nuevosInsumos });
                            
                            // Limpiar estados de búsqueda para este índice
                            const newSearchInsumo = {...searchInsumo};
                            const newDropdownOpen = {...dropdownOpen};
                            delete newSearchInsumo[index];
                            delete newDropdownOpen[index];
                            
                            // Reindexar los estados restantes
                            const reindexedSearchInsumo: {[key: number]: string} = {};
                            const reindexedDropdownOpen: {[key: number]: boolean} = {};
                            Object.keys(newSearchInsumo).forEach((key) => {
                              const numKey = Number(key);
                              if (numKey > index) {
                                reindexedSearchInsumo[numKey - 1] = newSearchInsumo[numKey];
                                reindexedDropdownOpen[numKey - 1] = newDropdownOpen[numKey];
                              } else if (numKey < index) {
                                reindexedSearchInsumo[numKey] = newSearchInsumo[numKey];
                                reindexedDropdownOpen[numKey] = newDropdownOpen[numKey];
                              }
                            });
                            
                            setSearchInsumo(reindexedSearchInsumo);
                            setDropdownOpen(reindexedDropdownOpen);
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Selector de insumo */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Insumo *
                        </label>
                        <div className="relative">
                          {/* Campo de búsqueda */}
                          <input
                            type="text"
                            value={searchInsumo[index] || ''}
                            onChange={(e) => {
                              setSearchInsumo({...searchInsumo, [index]: e.target.value});
                              setDropdownOpen({...dropdownOpen, [index]: true});
                            }}
                            onFocus={() => setDropdownOpen({...dropdownOpen, [index]: true})}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700"
                            placeholder="Buscar insumo..."
                          />
                          
                          {/* Dropdown con resultados */}
                          {dropdownOpen[index] && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filtrarInsumos(searchInsumo[index] || '').length > 0 ? (
                                filtrarInsumos(searchInsumo[index] || '').map(insumoOption => {
                                  const hasName = insumoOption.fields.nombre && insumoOption.fields.nombre.trim();
                                  const unidad = insumoOption.fields['Unidad Ingresa Insumo'] || insumoOption.fields.unidad_medida || 'unidad';
                                  const displayName = hasName ? insumoOption.fields.nombre : `Sin nombre - ${insumoOption.id.slice(-6)}`;
                                  
                                  return (
                                    <div
                                      key={insumoOption.id}
                                      onClick={() => {
                                        const nuevosInsumos = [...recibirData.insumos];
                                        nuevosInsumos[index].insumoId = insumoOption.id;
                                        setRecibirData({ ...recibirData, insumos: nuevosInsumos });
                                        setSearchInsumo({...searchInsumo, [index]: displayName || ''});
                                        setDropdownOpen({...dropdownOpen, [index]: false});
                                      }}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-gray-900">{displayName}</div>
                                      <div className="text-sm text-gray-500">{unidad}</div>
                                      {insumoOption.fields.categoria_insumo && (
                                        <div className="text-xs text-gray-400">{insumoOption.fields.categoria_insumo}</div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-center">
                                  No se encontraron insumos
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Botón para cerrar dropdown */}
                          {dropdownOpen[index] && (
                            <div 
                              className="fixed inset-0 z-5"
                              onClick={() => setDropdownOpen({...dropdownOpen, [index]: false})}
                            />
                          )}
                        </div>
                        
                        {/* Mostrar información de la unidad cuando se selecciona un insumo */}
                        {insumo.insumoId && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 flex items-center space-x-2">
                              <span>📏</span>
                              <span>
                                <strong>Unidad:</strong> {
                                  insumos.find(ins => ins.id === insumo.insumoId)?.fields['Unidad Ingresa Insumo'] || 
                                  insumos.find(ins => ins.id === insumo.insumoId)?.fields.unidad_medida || 
                                  'Sin unidad'
                                }
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={insumo.cantidadIngresaUnidades}
                          onChange={(e) => {
                            const nuevosInsumos = [...recibirData.insumos];
                            nuevosInsumos[index].cantidadIngresaUnidades = e.target.value;
                            setRecibirData({ ...recibirData, insumos: nuevosInsumos });
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700"
                          placeholder={
                            insumo.insumoId 
                              ? `Cantidad en ${
                                  insumos.find(ins => ins.id === insumo.insumoId)?.fields['Unidad Ingresa Insumo'] || 
                                  insumos.find(ins => ins.id === insumo.insumoId)?.fields.unidad_medida || 
                                  'unidades'
                                }`
                              : "Cantidad"
                          }
                          required
                        />
                      </div>

                      {/* Fecha de vencimiento */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Fecha de vencimiento
                        </label>
                        <input
                          type="date"
                          value={insumo.fechaVencimiento}
                          onChange={(e) => {
                            const nuevosInsumos = [...recibirData.insumos];
                            nuevosInsumos[index].fechaVencimiento = e.target.value;
                            setRecibirData({ ...recibirData, insumos: nuevosInsumos });
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Recibiendo...' : 'Recibir Pedido'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelarRecibirPedido}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      </div>

      <Footer />
    </>
  );
};

export default StockInsumosPage;