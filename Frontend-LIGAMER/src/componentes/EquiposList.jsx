import React from "react";
import './DashboardLayout.css';
import Sidebar from "./Sidebar";
import TablaCard from "./TablaCard";
import { getAllTeams } from "../utils/Service/usuario";
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { createTeam } from "../utils/Service/General";
import { text } from "d3";

export default function EquiposList() {
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ nombre: "", descripcion: "" });
  };

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({ ...prev, [name]: value }));
  // };
  const handleInputChange = (e) => {
    const { name, files, value } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };


const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.nombre.trim()) {
    Swal.fire({
      icon: 'error',
      title: 'Campo requerido',
      text: 'El nombre del equipo es obligatorio',
      confirmButtonColor: '#4A3287'
    });
    return;
  }

  try {
    const newTeam = await createTeam({
      name: formData.nombre,
      description: formData.descripcion,
      logoUrl: "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent(formData.nombre)
    });

    Swal.fire({
      icon: 'success',
      title: 'Equipo creado',
      text: `El equipo "${newTeam.name}" ha sido creado exitosamente`,
      confirmButtonColor: '#4A3287'
    });

    handleCloseModal();

    const updatedTeams = await getAllTeams();
    setTeams(updatedTeams);

  } catch (error) {
    console.log("ERROR COMPLETO:", error);
    console.log("ERROR BACKEND:", error.response?.data);

    // El backend devuelve el mensaje de error directamente como string
    const errorMessage = typeof error.response?.data === 'string' 
      ? error.response.data 
      : error.response?.data?.message || "Error al crear el equipo";

    Swal.fire({
      icon: "error",
      title: "Error al crear el equipo",
      text: errorMessage,
      confirmButtonColor: "#4A3287"
    });
  }
};


  useEffect(() => { 
    getAllTeams()
      .then((data) => {
        setTeams(data);
        console.log("Data equipos: " + data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    console.log("Equipos actualizado:", teams);
  }, [teams]);

  const menuItems = [
    { id: 1, ruta: 'user', label: 'Jugadores', icon: 'bi-person-lines-fill' },
    { id: 2, ruta: 'equipos', label: 'Equipos', icon : 'bi-people-fill' },
    { id: 3, ruta: 'jugadoresUser', label: 'Mi equipo', icon: 'bi-person-fill-gear' },
    { id: 4, ruta: 'miEquipo', label: 'Resultados de mi equipo', icon: 'bi-bar-chart-fill' },
    { id: 5, ruta: 'torneosDisponibles', label: 'Torneos', icon: 'bi-trophy-fill' },
  ];

  const encabezados = [
    {key:"name", label:"Nombre"}, 
    {key:"members",label:"Miembros"}, 
    {key:"description",label:"Descripción"}, 
    {key:"Acciones",label:"Acciones"}
  ];
  const datos = [
    { id: 1, nombre: "Los Rayos FC", miembros: 12, descripcion: "Equipo corporativo - turno mañana" },
    { id: 2, nombre: "Tigres del Norte", miembros: 10, descripcion: "Equipo mixto - veteranos" },
    { id: 3, nombre: "Ángeles Azules", miembros: 8, descripcion: "Equipo nuevo, buena coordinación" },
    { id: 4, nombre: "Team Queso", miembros: 11, descripcion: "Equipo informal - ex jugadores" },
    { id: 5, nombre: "Pixar", miembros: 9, descripcion: "Equipo creativo" },
  ];

  const acciones = [
    { accion: "Detalles", icon: "bi-eye-fill" },
    { accion: "Unirse", icon: "bi-person-fill-add" }, 
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar menuItems={menuItems} />
      <div className="mainContent container-fluid">
        <div className="row">
          <div className="col-12">
            <TablaCard
              encabezados={encabezados}
              datos={teams}
              acciones={acciones}
              actionButton={
                <button 
                  className="btn btn-primary"
                  style={{ 
                    backgroundColor: '#4A3287', 
                    borderColor: '#4A3287',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={handleOpenModal}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Crear Equipo
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* Modal para crear equipo */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Equipo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Equipo *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Los Rayos FC"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe tu equipo..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Logo del Equipo *</Form.Label>
              <Form.Control
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            style={{ backgroundColor: '#4A3287', borderColor: '#4A3287' }}
          >
            Crear Equipo
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
