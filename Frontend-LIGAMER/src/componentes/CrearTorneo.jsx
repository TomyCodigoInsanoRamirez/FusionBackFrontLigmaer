import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import './CrearTorneo.css';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {getTournamentById} from './../utils/Service/manager';
import {saveTournament} from './../utils/Service/manager';
import {updateTournament} from './../utils/Service/manager';


const MySwal = withReactContent(Swal);

export default function CrearTorneo({ estado = "Nuevo" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();


  const [tournamentName, setTournamentName] = useState('');
  const [description, setDescription] = useState('');
  const [numTeams, setNumTeams] = useState(8);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationCloseDate, setRegistrationCloseDate] = useState('');
  const [rules, setRules] = useState('');
  const [ruleList, setRuleList] = useState([]);
  const [generateTrigger, setGenerateTrigger] = useState(0);
  const [matches, setMatches] = useState({});           // ← Marcadores y resultados
  const [matchDates, setMatchDates] = useState({});     // ← Fechas de partidos (siempre existe)
  const [teamData, setTeamData] = useState({});         // ← Equipos en el bracket (solo en "En curso")
  const [graph, setGraph] = useState({ childToParent: {}, parentToChildren: {} });
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Modal de partido
  const [team1Input, setTeam1Input] = useState('');
  const [team2Input, setTeam2Input] = useState('');
  const [team1Image, setTeam1Image] = useState('');
  const [team2Image, setTeam2Image] = useState('');
  const [score1Input, setScore1Input] = useState('');
  const [score2Input, setScore2Input] = useState('');
  const [dateInput, setDateInput] = useState('');

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const svgRef = useRef();
  const prevGraphRef = useRef();
  const hasGenerated = useRef(false);
  const mappedDatesRef = useRef(false);
  const [data, setData] = useState({});

  // Genera un objeto matchDates con TODAS las claves posibles y valor vacío
const generateEmptyMatchDates = () => {
  const empty = {};
  nodes.forEach(node => {
    empty[node.id] = "";
  });
  return empty;
};


  // Resetear mapeo de fechas al regenerar o cambiar torneo
  useEffect(() => {
    mappedDatesRef.current = false;
  }, [id, generateTrigger]);

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resolver fecha aunque las claves tengan sufijos
  const resolveMatchDate = (nodeId) => {
    if (!nodeId || !matchDates) return undefined;
    if (matchDates[nodeId]) return matchDates[nodeId];

    const m = nodeId.match(/^node(\d+)/);
    if (m) {
      const num = m[1];
      const pref = `node${num}`;
      const found = Object.keys(matchDates).find(k => k.startsWith(pref));
      if (found) return matchDates[found];
    }
    return undefined;
  };

    // ==================== CARGA DEL TORNEO (Nuevo / Guardado / En curso) ====================
  useEffect(() => {
    if (estado === "Nuevo" || !id) return;

    const fetchTorneo = async () => {
      setLoading(true);
      setError(null);
      try {
        // === AQUÍ VA TU FETCH REAL AL BACKEND ===
        // const response = await fetch(`/api/torneos/${id}`);
        // const data = await response.json();

        // === SIMULACIÓN (reemplazar por el fetch real cuando lo tengas) ===
        // const data = {
        //   tournamentName: "Copa Internacional 2025",
        //   description: "Los 8 mejores clubes del mundo en eliminación directa",
        //   numTeams: 8,
        //   startDate: "2025-11-20",
        //   endDate: "2025-12-15",
        //   registrationCloseDate: "2025-11-18",
        //   ruleList: [
        //     "Eliminación directa",
        //     "En caso de empate: prórroga + penales",
        //     "Máximo 5 cambios por partido"
        //   ],
        //   matchDates: {
        //     "node0_topLeaf": "2025-11-23",
        //     "node1_topLeaf": "2025-11-23",
        //     "node2_topLeaf": "2025-11-24",
        //     "node3_topLeaf": "2025-11-24",
        //     "node4_top": "2025-11-25",
        //     "node5_top": "2025-11-25",
        //     "node6_top": "2025-11-26",
        //     "node13_bottom": "2025-11-26",
        //     "node11_bottom": "2025-11-27",
        //     "node12_bottom": "2025-11-27",
        //     "node7_bottomLeaf": "2025-11-28",
        //     "node8_bottomLeaf": "2025-11-28",
        //     "node9_bottomLeaf": "2025-11-29",
        //     "node10_bottomLeaf": "2025-11-29"
        //   },
        //   teams: estado === "En curso" ? [
        //     { name: "Real Madrid", image: "https://pbs.twimg.com/profile_images/1638090920951250944/QEPY4cpL_200x200.jpg" },
        //     { name: "Barcelona", image: "https://www.shutterstock.com/image-vector/barcelona-fc-cup-icon-logo-600nw-2267672941.jpg" },
        //     { name: "Bayern Munich", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/250px-FC_Bayern_M%C3%BCnchen_logo_%28202429.svg.png" },
        //     { name: "Manchester City", image: "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png" },
        //     { name: "River Plate", image: "https://brandemia.org/contenido/subidas/2022/02/000-river-plate-1200x670.jpg" },
        //     { name: "Boca Juniors", image: "https://www.sopitas.com/wp-content/uploads/2020/05/boca-juniors-historia-destras-escudo.png" },
        //     { name: "Flamengo", image: "https://www.shutterstock.com/image-vector/red-black-emblem-icon-vector-600w-2176171449.jpg" },
        //     { name: "Palmeiras", image: "https://cdn.conmebol.com/wp-content/uploads/2015/08/palmeiras-750px.jpg" }
        //   ] : [],
        //   matches: estado === "En curso" ? {
        //     "node4_top": { team1: "Real Madrid", team2: "Barcelona", score1: "3", score2: "1", date: "2025-11-23" },
        //     "node5_top": { team1: "Bayern Munich", team2: "Manchester City", score1: "2", score2: "3", date: "2025-11-23" },
        //     "node6_top": { team1: "River Plate", team2: "Boca Juniors", score1: "1", score2: "0", date: "2025-11-24" },
        //     "node13_bottom": { team1: "Flamengo", team2: "Palmeiras", score1: "4", score2: "2", date: "2025-11-24" },
        //     "node14_top": { team1: "Real Madrid", team2: "Bayern Munich", score1: "", score2: "", date: "2025-11-30" },
        //     "node15_bottom": { team1: "River Plate", team2: "Flamengo", score1: "2", score2: "1", date: "2025-11-30" }
        //   } : {}
        // };
        // === FIN DE SIMULACIÓN
        
        getTournamentById(id)
          .then((data) => {
          setData(data.data); 
          // Cargar datos básicos del torneo
          setTournamentName(data.data.tournamentName || 'Sin nombre de torneo');
          setDescription(data.data.description || '');
          setNumTeams(data.data.numTeams || 8);
          setStartDate(data.data.startDate || '');
          setEndDate(data.data.endDate || '');
          setRegistrationCloseDate(data.data.registrationCloseDate || '');
          setRuleList(data.data.ruleList || []);

          // Cargar fechas de partidos (pueden estar incompletas)
          setMatchDates(data.data.matchDates || {});

          // Cargar resultados (solo en "En curso")
          setMatches(data.data.matches || {});

          // Cargar equipos si existen (solo "En curso")
          if (data.data.teams && data.data.teams.length > 0) {
            window.__equiposTemporales = data.data.teams;
          }
        })
          .catch((err) => console.log(err));
                  
        // Cargar datos básicos del torneo
        setTournamentName(data.tournamentName || 'Sin nombre de torneo');
        setDescription(data.description || '');
        setNumTeams(data.numTeams || 8);
        setStartDate(data.startDate || '');
        setEndDate(data.endDate || '');
        setRegistrationCloseDate(data.registrationCloseDate || '');
        setRuleList(data.ruleList || []);

        // Cargar fechas de partidos (pueden estar incompletas)
        setMatchDates(data.matchDates || {});

        // Cargar resultados (solo en "En curso")
        setMatches(data.matches || {});

        // Cargar equipos si existen (solo "En curso")
        if (data.teams && data.teams.length > 0) {
          window.__equiposTemporales = data.teams;
        }

        // Forzamos la generación del bracket
        hasGenerated.current = true;
        setGenerateTrigger(prev => prev + 1);

        // === FIX CLAVE: después de generar el bracket, completamos matchDates con todas las claves vacías ===
        // Esto garantiza que SIEMPRE existan todas las keys, incluso si el usuario guardó a medias
        const completarMatchDates = () => {
          setMatchDates(prev => {
            const completo = { ...prev };
            // Recorremos todos los nodos generados
            nodes.forEach(node => {
              if (!(node.id in completo)) {
                completo[node.id] = "";
              }
            });
            return completo;
          });
        };

        // Damos un pequeño delay para asegurar que los nodos ya existan
        setTimeout(completarMatchDates, 150);

      } catch (err) {
        setError("Error al cargar el torneo. Por favor, intenta de nuevo.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTorneo();
  }, [id, estado]);

  useEffect(() => {
    console.log("Respuesta real backend DATA TORNEO", data);
  }, [data]);

  const volver = () => {
    navigate(user.role === "ROLE_ORGANIZADOR" ? '/manager' : '/user');
    console.log("Yendo a "+user.role+"/")
  };

  const addRule = () => {
    if (rules.trim()) {
      setRuleList(prev => [...prev, rules.trim()]);
      setRules('');
    }
  };

  const removeRule = (index) => {
    setRuleList(prev => prev.filter((_, i) => i !== index));
  };

  // ==================== GENERACIÓN DEL BRACKET ====================
  useEffect(() => {
    if (generateTrigger === 0) return;

    let nodeId = 0;
    const newNodes = [];
    const newConnections = [];

    const baseCount = Math.max(1, numTeams / 2);
    const dynamicWidth = Math.max(1200, baseCount * 120);
    const dynamicHeight = 1200;
    const centerX = dynamicWidth / 2;
    const centerY = dynamicHeight / 2;
    const totalLevels = Math.log2(Math.max(2, numTeams));
    const branchLevels = Math.max(1, Math.floor(totalLevels) - 1);

    let levelSpacing = 200;
    if (numTeams > 32) levelSpacing = 250;
    if (numTeams > 64) levelSpacing = 300;
    if (numTeams > 128) levelSpacing = 350;

    const spreadSpacing = Math.max(80, (dynamicWidth - 400) / (baseCount - 1 || 1));

    const createBranch = (isTop) => {
      const direction = isTop ? -1 : 1;
      const branchHeight = branchLevels;
      const levelsNodes = [];
      const leafCount = baseCount;
      const leafY = centerY + direction * branchHeight * levelSpacing;
      const leafNodes = [];
      for (let i = 0; i < leafCount; i++) {
        const x = centerX + (i - (leafCount - 1) / 2) * spreadSpacing;
        const node = { id: `node${nodeId++}_${isTop ? 'topLeaf' : 'bottomLeaf'}`, x, y: leafY, isTop };
        newNodes.push(node);
        leafNodes.push(node);
      }
      levelsNodes.push(leafNodes);
      for (let level = branchHeight - 1; level >= 0; level--) {
        const children = levelsNodes[0];
        const parents = [];
        for (let i = 0; i < children.length; i += 2) {
          const c1 = children[i];
          const c2 = children[i + 1];
          const parentY = (c1.y + c2.y) / 2 - direction * levelSpacing;
          const parentX = (c1.x + c2.x) / 2;
          const parent = { id: `node${nodeId++}_${isTop ? 'top' : 'bottom'}`, x: parentX, y: parentY, isTop };
          newNodes.push(parent);
          newConnections.push({ from: parent, to: c1 });
          newConnections.push({ from: parent, to: c2 });
          parents.push(parent);
        }
        levelsNodes.unshift(parents);
      }
      const apex = levelsNodes[0][0];
      apex.x = centerX;
      apex.y = centerY + direction * levelSpacing;
      return apex;
    };


    const apexTop = createBranch(true);
    const apexBottom = createBranch(false);

    const centralNode = { id: `node${nodeId++}_central`, x: centerX, y: centerY, isTop: null };
    newNodes.push(centralNode);
    newConnections.push({ from: centralNode, to: apexTop });
    newConnections.push({ from: centralNode, to: apexBottom });

    const childToParent = {};
    const parentToChildren = {};
    newConnections.forEach(c => {
      if (!parentToChildren[c.from.id]) parentToChildren[c.from.id] = [];
      parentToChildren[c.from.id].push(c.to.id);
      childToParent[c.to.id] = c.from.id;
    });

    let minX = Math.min(...newNodes.map(d => d.x));
    let maxX = Math.max(...newNodes.map(d => d.x));
    let minY = Math.min(...newNodes.map(d => d.y));
    let maxY = Math.max(...newNodes.map(d => d.y));
    const padding = 100;
    minX -= padding / 2;
    maxX += padding / 2;
    minY -= padding / 2;
    maxY += padding / 2;

    newNodes.forEach(d => {
      d.x -= minX;
      d.y -= minY;
    });

    setGraph({ childToParent, parentToChildren });
    setNodes(newNodes);
    setConnections(newConnections);
  }, [generateTrigger, numTeams]);

  // ==================== ASIGNAR EQUIPOS EN "EN CURSO" ====================
  useEffect(() => {
    if (estado === "En curso" && nodes.length > 0 && window.__equiposTemporales) {
      const leaves = nodes
        .filter(d => !graph.parentToChildren[d.id])
        .sort((a, b) => a.y - b.y || a.x - b.x);

      const newTeamData = {};
      window.__equiposTemporales.forEach((eq, i) => {
        if (i < leaves.length) {
          newTeamData[leaves[i].id] = { name: eq.name, image: eq.image };
        }
      });
      setTeamData(newTeamData);
      delete window.__equiposTemporales;
    }
  }, [nodes, estado, graph]);

  // ==================== AVANCE AUTOMÁTICO DE GANADORES AL CARGAR "En curso" ====================
useEffect(() => {
  // Solo ejecutamos en modo "En curso" y cuando ya tenemos todo cargado
  if (estado !== "En curso" || nodes.length === 0 || Object.keys(matches).length === 0) return;

  let hasAdvanced = false;

  const newTeamData = { ...teamData };

  // Recorremos todos los partidos que YA tienen resultado guardado
  Object.keys(matches).forEach(parentId => {
    const match = matches[parentId];
    const score1 = parseInt(match.score1) || 0;
    const score2 = parseInt(match.score2) || 0;

    // Si ya hay un ganador claro y aún no hemos puesto al ganador en el nodo padre
    if ((score1 > score2 || score2 > score1) && !newTeamData[parentId]) {
      const children = graph.parentToChildren[parentId];
      if (!children || children.length !== 2) return;

      const child1 = children[0];
      const child2 = children[1];

      const team1 = teamData[child1];
      const team2 = teamData[child2];

      if (!team1 || !team2) return; // Seguridad por si faltan equipos

      // Determinar quién ganó
      const winnerTeam = score1 > score2 
        ? (match.team1 === team1.name ? team1 : team2)
        : (match.team2 === team2.name ? team2 : team1);

      newTeamData[parentId] = winnerTeam;
      hasAdvanced = true;
    }
  });

  // Solo actualizamos el estado si realmente avanzó alguien (evita re-renders infinitos)
  if (hasAdvanced) {
    setTeamData(newTeamData);
  }
}, [estado, nodes, matches, teamData, graph]); // Dependencias correctas y seguras

  // ==================== MAPEO DE FECHAS GUARDADAS (solo en Guardado) ====================
  useEffect(() => {
    if (estado !== "Guardado" || mappedDatesRef.current || nodes.length === 0) return;

    const savedKeys = Object.keys(matchDates);
    if (savedKeys.length === 0) return;

    const savedValues = savedKeys.map(k => matchDates[k]);
    const targetLeaves = nodes
      .filter(d => !graph.parentToChildren[d.id])
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const merged = { ...matchDates };
    for (let i = 0; i < Math.min(savedValues.length, targetLeaves.length); i++) {
      const leafId = targetLeaves[i].id;
      if (!merged[leafId]) {
        merged[leafId] = savedValues[i];
      }
    }

    mappedDatesRef.current = true;
    setMatchDates(merged);
  }, [nodes, graph, matchDates, estado]);

  // ==================== RELLENAR MODAL AL SELECCIONAR PARTIDO ====================
useEffect(() => {
  if (!selectedNode) return;

  const parentId = graph.childToParent[selectedNode];
  if (!parentId) {
    setSelectedNode(null);
    return;
  }

  const siblings = graph.parentToChildren[parentId] || [];
  const rivalId = siblings.find(id => id !== selectedNode);

  // Si por alguna razón no encuentra al rival (raro, pero por seguridad)
  if (!rivalId) {
    handleCloseModal();
    return;
  }

  // Función para buscar el equipo subiendo por el árbol
  const findTeamInTree = (nodeId) => {
    if (teamData[nodeId]) return teamData[nodeId];

    let current = nodeId;
    while (graph.childToParent[current]) {
      current = graph.childToParent[current];
      if (teamData[current]) return teamData[current];
    }
    return null;
  };

  const team1 = findTeamInTree(selectedNode);
  const team2 = findTeamInTree(rivalId); // ← Aquí estaba el error: "rival" → "rivalId"

  setTeam1Input(team1?.name || 'por definir');
  setTeam1Image(team1?.image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_lettermark_logo.png');

  setTeam2Input(team2?.name || 'por definir');
  setTeam2Image(team2?.image || 'https://images.steamusercontent.com/ugc/2012596709485058287/7DAE5A8599A6A4EA24F8F41DB7C82C17B1F126A5/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false');

  // Marcadores y fecha
  const match = matches[parentId];
  if (match) {
    // Determinamos cuál es el equipo 1 según lo que guardamos
    const isTeam1Current = match.team1 === team1?.name;
    setScore1Input(isTeam1Current ? match.score1 || '' : match.score2 || '');
    setScore2Input(isTeam1Current ? match.score2 || '' : match.score1 || '');
    setDateInput(match.date || resolveMatchDate(selectedNode) || '');
  } else {
    setScore1Input('');
    setScore2Input('');
    setDateInput(resolveMatchDate(selectedNode) || '');
  }
}, [selectedNode, graph, teamData, matches, matchDates]);

  const handleCloseModal = () => {
    setSelectedNode(null);
    setTeam1Input(''); setTeam2Input(''); setTeam1Image(''); setTeam2Image('');
    setScore1Input(''); setScore2Input(''); setDateInput('');
  };

  // ==================== GUARDAR PARTIDO (fechas o marcadores) ====================
  const handleSave = () => {
    if (!selectedNode) return;
    const parentId = graph.childToParent[selectedNode];
    if (!parentId) {
      handleCloseModal();
      return;
    }
    const siblings = graph.parentToChildren[parentId];
    const rivalId = siblings.find(id => id !== selectedNode);

    if (estado === "En curso") {
      // Validaciones para modo "En curso"
      
      // 1. Validar que todos los campos estén llenos
      if (!team1Input.trim() || !team2Input.trim() || score1Input === '' || score2Input === '' || !dateInput) {
        MySwal.fire({
          icon: 'warning',
          title: 'Campos incompletos',
          text: 'Por favor, completa todos los campos.',
          confirmButtonColor: '#4A3287'
        });
        return;
      }

      // 2. Validar que las puntuaciones no sean negativas
      const s1 = parseInt(score1Input);
      const s2 = parseInt(score2Input);
      
      if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
        MySwal.fire({
          icon: 'error',
          title: 'Puntuaciones inválidas',
          text: 'Las puntuaciones deben ser números enteros no negativos.',
          confirmButtonColor: '#4A3287'
        });
        return;
      }

      // 3. Confirmación antes de guardar
      MySwal.fire({
        title: '¿Confirmar resultado?',
        text: `${team1Input} ${s1} - ${s2} ${team2Input}`,
        icon: 'question',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Guardar',
        confirmButtonColor: '#4A3287',
        cancelButtonColor: '#dc3545',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          // Guardar datos
          setMatches(prev => ({
            ...prev,
            [parentId]: {
              team1: team1Input,
              team2: team2Input,
              score1: score1Input,
              score2: score2Input,
              date: dateInput
            }
          }));

          let winnerData = null;
          if (s1 > s2) winnerData = teamData[selectedNode];
          else if (s2 > s1) winnerData = teamData[rivalId];

          if (winnerData) {
            setTeamData(prev => ({ ...prev, [parentId]: winnerData }));
          }

          // 4. Mensaje de éxito
          MySwal.fire({
            icon: 'success',
            title: '¡Resultado guardado!',
            text: 'El enfrentamiento se ha configurado correctamente.',
            confirmButtonColor: '#4A3287'
          });

          handleCloseModal();
        }
      });
    } else {
      // Validaciones para modo "Nuevo" o "Guardado"
      
      // 1. Validar que se haya seleccionado una fecha
      if (!dateInput) {
        MySwal.fire({
          icon: 'warning',
          title: 'Fecha requerida',
          text: 'Por favor, selecciona una fecha para el enfrentamiento.',
          confirmButtonColor: '#4A3287'
        });
        return;
      }

      // 2. Confirmación antes de guardar
      MySwal.fire({
        title: '¿Confirmar fecha?',
        text: `Se programará el enfrentamiento para el ${new Date(dateInput).toLocaleDateString()}`,
        icon: 'question',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Guardar',
        confirmButtonColor: '#4A3287',
        cancelButtonColor: '#dc3545',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          // NUEVO / GUARDADO → ahora garantizamos que TODAS las claves existan
          setMatchDates(prev => {
            const updated = { ...prev };

            // Si es la primera vez o faltan claves → llenamos todo con ""
            if (Object.keys(updated).length === 0 || Object.keys(updated).length < nodes.length) {
              nodes.forEach(node => {
                if (!(node.id in updated)) {
                  updated[node.id] = "";
                }
              });
            }

            // Asignamos la fecha elegida a los dos hijos (hojas del partido)
            updated[selectedNode] = dateInput;
            updated[rivalId] = dateInput;

            return updated;
          });

          // 3. Mensaje de éxito
          MySwal.fire({
            icon: 'success',
            title: '¡Fecha programada!',
            text: 'La fecha del enfrentamiento se ha guardado correctamente.',
            confirmButtonColor: '#4A3287'
          });

          handleCloseModal();
        }
      });
    }
  };

  // ==================== BOTONES PRINCIPALES ====================
  const handleGuardar = async () => {
  const torneoData = {
    tournamentName,
    description,
    numTeams,
    startDate,
    endDate,
    registrationCloseDate,
    ruleList: [...ruleList],
    matchDates: { ...matchDates },
    estado: "Guardado",
    generadoEl: new Date().toISOString(),
  };

  try {
    const response = await saveTournament(torneoData); // ← async/await

    console.clear();
    console.log("%cBORRADOR GUARDADO", "color: #4A3287; font-size: 20px; font-weight: bold;");
    console.log("Respuesta del servidor:", response);

    MySwal.fire({
      icon: 'success',
      title: '¡Borrador guardado con éxito!',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });

  } catch (error) {
    console.error("Error al guardar el torneo:", error);

    MySwal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.message || 'No se pudo guardar el borrador',
      toast: true,
      position: 'top-end',
    });
  }
  if(estado!=="En curso"){
    volver();
  }
};

  const handleActualizar = async () => {
    const torneoData = {
      tournamentName,
      description,
      numTeams,
      startDate,
      endDate,
      registrationCloseDate,
      ruleList: [...ruleList],
      matchDates: { ...matchDates },
      estado: "Guardado",
      generadoEl: new Date().toISOString(),
    };

    try {
      const response = await updateTournament(id,torneoData); // ← async/await

      MySwal.fire({
        icon: 'success',
        title: '¡Borrador guardado con éxito!',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
      if(estado!=="En curso"){
        volver();
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo guardar el borrador',
        toast: true,
        position: 'top-end',
      });
    }
  }

  const handleCrearTorneo = async () => { //= async () => {
    const torneoData = {
      tournamentName,
      description,
      numTeams,
      startDate,
      endDate,
      registrationCloseDate,
      ruleList: [...ruleList],
      matchDates: { ...matchDates },
      estado: "En curso",
      generadoEl: new Date().toISOString(),
    };

    try {
      const response = await updateTournament(id,torneoData); // ← async/await

      MySwal.fire({
        icon: 'success',
        title: '¡Torneo creado y publicado!',
        text: 'Ya está en curso',
        toast: true,
        position: 'top-end',
        timer: 3000
      });
      if(estado!=="En curso"){
        volver();
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudo guardar el borrador',
        toast: true,
        position: 'top-end',
      });
    }
  };

  const handleCancel = () => {
    MySwal.fire({
      title: '¿Cancelar?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4A3287',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) volver();
    });
  };

  // ==================== RENDER D3 ====================
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const g = svg.append('g');

    const zoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const requiredWidth = Math.max(...nodes.map(d => d.x)) + 100;
    const requiredHeight = Math.max(...nodes.map(d => d.y)) + 100;
    svg.attr('viewBox', `0 0 ${requiredWidth} ${requiredHeight}`);

    const lineGenerator = d3.line().x(d => d.x).y(d => d.y).curve(d3.curveStep);

    const isFullRedraw = prevGraphRef.current !== graph;
    prevGraphRef.current = graph;
    const speedFactor = isFullRedraw ? (numTeams > 32 ? 0.33 : numTeams > 16 ? 0.5 : 1) : 0;

    connections.forEach((c, i) => {
      const lineData = [
        { x: c.from.x, y: c.from.y },
        { x: c.from.x, y: (c.from.y + c.to.y) / 2 },
        { x: c.to.x, y: (c.from.y + c.to.y) / 2 },
        { x: c.to.x, y: c.to.y }
      ];
      g.append('path')
        .datum(lineData)
        .attr('d', lineGenerator)
        .attr('stroke', '#020722')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('opacity', speedFactor > 0 ? 0 : 1)
        .transition()
        .delay(speedFactor > 0 ? i * 35 * speedFactor : 0)
        .duration(speedFactor > 0 ? 420 * speedFactor : 0)
        .attr('opacity', 1);
    });

    const defs = g.append('defs');
    nodes.forEach(d => {
      const team = teamData[d.id];
      if (team?.image) {
        const pattern = defs.append('pattern')
          .attr('id', `pattern-${d.id}`)
          .attr('width', 1)
          .attr('height', 1)
          .attr('patternContentUnits', 'objectBoundingBox');
        pattern.append('image')
          .attr('href', team.image)
          .attr('width', 1)
          .attr('height', 1)
          .attr('preserveAspectRatio', 'xMidYMid slice');
      }
    });

    const getFill = (d) => {
      const team = teamData[d.id];
      if (team?.image) return `url(#pattern-${d.id})`;
      // if (!(team.image)) return `https://upload.wikimedia.org/wikipedia/commons/7/7c/Fortnite_F_lettermark_logo.png`;
      if (resolveMatchDate(d.id)) return '#020722';
      if (!team?.name) return '#00A6A6';
      const parentId = graph.childToParent[d.id];
      if (!parentId) return '#FFD700';
      const match = matches[parentId];
      if (!match || !match.date) return '#00A6A6';
      const s1 = parseInt(match.score1 || 0);
      const s2 = parseInt(match.score2 || 0);
      const isTeam1 = match.team1 === team.name;
      if (s1 === s2) return '#4CAF50';
      return isTeam1 ? (s1 > s2 ? '#FFD700' : '#808080') : (s2 > s1 ? '#FFD700' : '#808080');
    };

    const getStroke = (d) => resolveMatchDate(d.id) ? '#FAE143' : '#020722';

    g.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', speedFactor > 0 ? 0 : 20)
      .attr('fill', getFill)
      .attr('stroke', getStroke)
      .attr('stroke-width', 3)
      .attr('opacity', speedFactor > 0 ? 0 : 1)
      .style('cursor', 'pointer')
      .on('click', (_, d) => graph.childToParent[d.id] && setSelectedNode(d.id))
      .on('mouseover', (_, d) => setHoveredNode(d.id))
      .on('mouseout', () => setHoveredNode(null))
      .transition()
      .delay(speedFactor > 0 ? (_, i) => i * 25 * speedFactor : 0)
      .duration(speedFactor > 0 ? 600 * speedFactor : 0)
      .attr('r', 20)
      .attr('opacity', 1);
  }, [nodes, connections, graph, matches, teamData, numTeams, matchDates]);

  // ← Pega esto ANTES del return (importante!)
const handleNumTeamsChange = (newValue) => {
  // Si ya generamos el bracket alguna vez, avisamos que se van a borrar las fechas
  if (nodes.length > 0 && numTeams !== newValue) {
    MySwal.fire({
      title: '¿Cambiar cantidad de equipos?',
      text: 'El bracket cambiará completamente y se eliminarán todas las fechas que ya configuraste.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        setNumTeams(newValue);
        setMatchDates({});           // Borra fechas viejas
        setMatches({});
        setTeamData({});
        mappedDatesRef.current = false;
        setGenerateTrigger(prev => prev + 1);  // ← Fuerza regenerar el bracket
      }
    });
  } else {
    // Si es la primera vez o no hay bracket aún
    setNumTeams(newValue);
  }
};

  // ==================== FORMULARIO DE CONFIGURACIÓN ==================== onChange={e => handleNumTeamsChange(parseInt(e.target.value))}
  const configForm = (
    <Form className="p-3">
      <h2 className="mb-4">Crear Torneo</h2>
      <Form.Group className="mb-3">
        <Form.Label>Nombre del Torneo:</Form.Label>
        <Form.Control type="text" placeholder="Ingresa el nombre" value={tournamentName} onChange={e => setTournamentName(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Descripción:</Form.Label>
        <Form.Control as="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Cantidad de Equipos:</Form.Label>
        {/* <Form.Select value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))}>  */}
        <Form.Select value={numTeams} onChange={e => handleNumTeamsChange(parseInt(e.target.value))}> 
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </Form.Select>
      </Form.Group>

      <h2 className="mt-5 mb-3">Fechas:</h2>
      <Form.Group className="mb-3">
        <Form.Label>Fecha Inicio:</Form.Label>
        <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Fecha Fin:</Form.Label>
        <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Cierre de convocatoria:</Form.Label>
        <Form.Control type="date" value={registrationCloseDate} onChange={e => setRegistrationCloseDate(e.target.value)} />
      </Form.Group>

      <div className="mt-5">
        <h2 className="mb-3">Reglas</h2>
        <InputGroup className="mb-3">
          <Form.Control type="text" value={rules} onChange={e => setRules(e.target.value)} onKeyPress={e => e.key === 'Enter' && addRule()} placeholder="Escribe una regla..." />
          <Button variant="primary" onClick={addRule}>+</Button>
        </InputGroup>
        <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {ruleList.map((rule, index) => (
            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
              {rule}
              <Button variant="link" className="text-danger" onClick={() => removeRule(index)}>×</Button>
            </ListGroup.Item>
          ))}
          {ruleList.length === 0 && (
            <ListGroup.Item className="text-muted fst-italic text-center">No hay reglas agregadas aún</ListGroup.Item>
          )}
        </ListGroup>
      </div>

      <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
        <Button className='btnn cancelar'  onClick={handleCancel} >Cancelar Creación</Button>
        <Button className='btnn generar'  onClick={() => { setGenerateTrigger(prev => prev + 1); setShowConfigModal(false); }} >
          Generar Bracket
        </Button>
        {data.estado == 'Guardado' && (
          <Button className='btnn guardar' onClick={handleActualizar}>
            Guardar como borrador
          </Button>
        )}
        {estado == 'Nuevo' && (
          <Button className='btnn guardar' onClick={handleGuardar}>
            Guardar como borrador 
          </Button>
        )}
      </div>

      <div className="d-flex justify-content-center mt-2">
        <Button className='btnn crear'   onClick={handleCrearTorneo} >
          Publicar Torneo 
        </Button>
      </div>
    </Form>
  );

  // ==================== RENDER FINAL ====================
  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando torneo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={volver}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-md-row vh-100 crear-torneo">
      {estado !== "En curso" && !isMobile && (
        <div className="col-md-3 p-3 overflow-auto" style={{ color: '#00A6A6' }}>
          {configForm}
        </div>
      )}

      <div className="position-relative overflow-hidden flex-grow-1">
        <svg ref={svgRef} className="w-100 h-100" style={{ background: '#f0f0f0' }} />

        {tournamentName && (
          <div className="position-absolute top-0 start-0 bg-dark text-white p-2 rounded" style={{ zIndex: 5 }}>
            {tournamentName}
          </div>
        )}

        <div className="position-absolute top-0 end-0 bg-white border border-dark p-1 rounded" style={{ pointerEvents: 'none', zIndex: 5, display: hoveredNode ? 'block' : 'none' }}>
          {teamData[hoveredNode]?.name || 'por definir'}
        </div>

        {estado !== "En curso" && isMobile && (
          <Button variant="primary" size="lg" className="position-absolute" style={{ bottom: '20px', right: '20px', zIndex: 10 }} onClick={() => setShowConfigModal(true)}>
            Configurar
          </Button>
        )}

        {estado === "En curso" && (
          <div className="position-absolute start-0 bottom-0 p-3" style={{ zIndex: 5 }}>
            <Button variant="danger" onClick={volver}>Volver</Button>
          </div>
        )}
      </div>

      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} fullscreen={isMobile}>
        <Modal.Header closeButton>
          <Modal.Title>Configurar Torneo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {configForm}
        </Modal.Body>
      </Modal>

      <Modal show={!!selectedNode} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Configurar enfrentamiento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNode && (() => {
            const parentId = graph.childToParent[selectedNode];
            const siblings = graph.parentToChildren[parentId] || [];
            const rivalId = siblings.find(id => id !== selectedNode);
            const isEnCurso = estado === "En curso";

            return (
              <Form>
                <div className="d-flex justify-content-between mb-3 align-items-center">
                  {team1Image && <img src={team1Image} alt="Equipo 1" style={{ width: 50, marginRight: 10 }} />}
                  <Form.Control type="text" value={team1Input} readOnly placeholder="Equipo 1" className="me-2" />
                  <span className="align-self-center">Vs</span>
                  <Form.Control type="text" value={team2Input} readOnly placeholder="Equipo 2" className="ms-2" />
                  {team2Image && <img src={team2Image} alt="Equipo 2" style={{ width: 50, marginLeft: 10 }} />}
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <Form.Control type="number" value={score1Input} onChange={e => setScore1Input(e.target.value)} placeholder="Marcador 1" readOnly={!isEnCurso} className="me-2" />
                  <span className="align-self-center">-</span>
                  <Form.Control type="number" value={score2Input} onChange={e => setScore2Input(e.target.value)} placeholder="Marcador 2" readOnly={!isEnCurso} className="ms-2" />
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha del enfrentamiento:</Form.Label>
                  <Form.Control type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} readOnly={isEnCurso} />
                </Form.Group>
              </Form>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSave} disabled={estado !== "En curso" && !dateInput}>
            Guardar
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
        </Modal.Footer>
      </Modal>

            {/* ==================== MODAL FLOTANTE DE REGLAS (solo "En curso") ==================== */}
      {estado === "En curso" && ruleList.length > 0 && (
        <>
          {/* Botón flotante */}
          <Button
            variant="outline-light"
            size="sm"
            className="position-fixed   d-flex align-items-center gap-2"
            style={{
              bottom: '60px',
              left: '15px',
              zIndex: 1000,
              backgroundColor: '#00A6A6',
              border: '2px solid #00A6A6',
              color: '#ffffffff',
            }}
            onClick={() => setShowRulesModal(prev => !prev)}
          >
            Reglas del Torneo
            <span style={{ fontSize: '16px' }}>{showRulesModal ? '▲' : '▼'}</span>
          </Button>

          {/* Panel colapsable */}
          <div
            className="position-fixed shadow-lg rounded-3 overflow-hidden"
            style={{
              bottom: '80px',
              left: '20px',
              width: isMobile ? 'calc(100% - 40px)' : '380px',
              maxHeight: showRulesModal ? '500px' : '0px',
              opacity: showRulesModal ? 1 : 0,
              transform: showRulesModal ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 999,
              backgroundColor: 'rgba(2, 7, 34, 0.97)',
              border: '2px solid #00A6A6',
              backdropFilter: 'blur(12px)',
              pointerEvents: showRulesModal ? 'auto' : 'none',
            }}
            onClick={(e) => e.target === e.currentTarget && setShowRulesModal(false)}
          >
            <div className="p-3 text-white">
              <h5 className="mb-3 text-center" style={{ color: '#00A6A6', fontWeight: 'bold' }}>
                Reglas del Torneo
              </h5>
              <ListGroup variant="flush">
                {ruleList.map((rule, index) => (
                  <ListGroup.Item
                    key={index}
                    className="bg-transparent border-bottom border-secondary text-white py-2"
                    style={{ borderLeft: '3px solid #00A6A6' }}
                  >
                    <span className="me-2 fw-bold" style={{ color: '#00A6A6' }}>•</span>
                    {rule}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </div>
        </>
      )}
    </div>
  );
}