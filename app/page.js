'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, snapCenterToCursor } from '@dnd-kit/modifiers';
import { Lock, Unlock, MoveUp, MoveDown, Trash2, PlusCircle, X, Edit, Save as SaveIcon, FolderOpen, List, Plus, Music4, Library, Coffee, ChevronDown, ChevronUp, Clock, Edit2, Eye, FileText, GripVertical, ListMusic, Loader2, Menu as Menu2, RefreshCw, ListMusic as ListMusic2, FileText as FileText2, ChevronRight } from 'lucide-react';
import { LyricsModal } from "@/components/lyrics-modal";
import AddSongForm from '../components/AddSongForm';
import EditSongForm from '../components/EditSongForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Notification } from "@/components/ui/notification";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Utility function for formatting duration
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 200, // Slightly longer for smoother movement
      easing: 'ease-out' // Simpler easing function
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition, // Remove transition while dragging
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 999 : 0, // Higher z-index for dragging
    position: 'relative',
    touchAction: 'none',
    willChange: isDragging ? 'transform' : undefined // Performance optimization
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function SetBreak({ id, onRemove, index, setlist }) {
  // Calculate total duration of songs after this break until the next break
  const calculateDurationAfterBreak = () => {
    const itemsAfterBreak = setlist.slice(index + 1);
    let totalDuration = 0;
    
    for (const item of itemsAfterBreak) {
      if (item.type === 'break') {
        break; // Stop counting when we hit another break
      }
      totalDuration += parseInt(item.duration) || 0;
    }
    
    return totalDuration;
  };

  const totalDuration = calculateDurationAfterBreak();

  return (
    <div className="flex items-center justify-between w-full p-1.5 bg-red-900 hover:bg-red-800 rounded-md transition-colors border border-white/10">
      <div className="flex items-center gap-1.5">
        <MoveUp className="h-4 w-4 text-white hover:text-white/80" />
        <div>
          <p className="font-medium text-sm text-white">{id.name}</p>
          <p className="text-xs text-white">
            Duration: {formatDuration(totalDuration)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onRemove(id.setlistId)}
        className="hover:bg-accent/10 rounded-full p-1"
      >
        <Trash2 className="h-3.5 w-3.5 text-white hover:text-destructive" />
      </button>
    </div>
  );
}

const Menu = ({ onRefresh, onManageSongs, onManageSetlists, onAddBreak, isRefreshing }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-gray-800 rounded-md"
      >
        <Menu2 className="h-8 w-8 text-gray-400" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-black/95 ring-1 ring-white/10 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => {
                onRefresh();
                setShowMenu(false);
              }}
              disabled={isRefreshing}
              className="w-full text-left px-4 py-4 text-lg hover:bg-gray-800/50 flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-6 w-6 mr-3 text-yellow-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                onManageSongs();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-4 text-lg hover:bg-gray-800/50 flex items-center"
            >
              <Music4 className="h-6 w-6 mr-3 text-yellow-500" />
              Manage Songs
            </button>
            <button
              onClick={() => {
                onManageSetlists();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-4 text-lg hover:bg-gray-800/50 flex items-center"
            >
              <ListMusic2 className="h-6 w-6 mr-3 text-yellow-500" />
              Manage Setlists
            </button>
            <button
              onClick={() => {
                onAddBreak();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-4 text-lg hover:bg-gray-800/50 flex items-center"
            >
              <Coffee className="h-6 w-6 mr-3 text-yellow-500" />
              Add Break
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSongs, setAvailableSongs] = useState([]);
  const [setlist, setSetlist] = useState([]);
  const [showSongPanel, setShowSongPanel] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);
  const [selectedSongIds, setSelectedSongIds] = useState(new Set());
  const [isLocked, setIsLocked] = useState(true);
  const [isMaster, setIsMaster] = useState(false);
  const [editMode, setEditMode] = useState('show'); // 'show', 'edit', 'locked'
  const [viewingSongId, setViewingSongId] = useState(null);
  const [setlists, setSetlists] = useState({});
  const [showManageSetlists, setShowManageSetlists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState(null);
  const [currentPlaylistName, setCurrentPlaylistName] = useState('Untitled Setlist');
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState(null);
  const [showPlaylistDeleteConfirm, setShowPlaylistDeleteConfirm] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [playlistToOverwrite, setPlaylistToOverwrite] = useState(null);
  const [showNewPlaylistDialog, setShowNewPlaylistDialog] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState("");
  const [setlistToRename, setSetlistToRename] = useState(null);
  const [showNewSongForm, setShowNewSongForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const lastSelectedId = useRef(null);
  const flashingIntervalRef = useRef(null);
  const [flashingSongId, setFlashingSongId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/click.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleFlashEffect = (songId, tempo) => {
    if (flashingIntervalRef.current) {
      clearInterval(flashingIntervalRef.current);
      flashingIntervalRef.current = null;
      setFlashingSongId(null);
      return;
    }
    if (!tempo) return;
    const interval = 60000 / tempo;
    flashingIntervalRef.current = setInterval(() => {
      setFlashingSongId(prevId => {
        if (prevId === songId) {
          audioRef.current?.play();
          return null;
        }
        return songId;
      });
    }, interval);
    setFlashingSongId(songId);
    audioRef.current?.play();
  };

  const playSoundAndFlash = (songId) => {
    if (editMode === 'show' && audioRef.current) {
      setFlashingSongId(songId);
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setTimeout(() => setFlashingSongId(null), 200);
    }
  };

  // Load setlists and last used setlist
  useEffect(() => {
    const loadSetlistsAndLastUsed = async () => {
      try {
        // Load all setlists
        const setlistsResponse = await fetch('/api/setlists');
        if (!setlistsResponse.ok) {
          throw new Error('Failed to load setlists');
        }
        const setlistsData = await setlistsResponse.json();
        const loadedSetlists = setlistsData.setlists || {};
        setSetlists(loadedSetlists);

        // Get last used setlist ID from localStorage
        const lastUsedSetlistId = localStorage.getItem('lastUsedSetlistId') || 'current';
        
        if (lastUsedSetlistId && loadedSetlists[lastUsedSetlistId]) {
          // Load the last used setlist
          const setlist = loadedSetlists[lastUsedSetlistId];
          setSetlist(setlist.setlist || []);
          setCurrentPlaylistName(setlist.name || 'Untitled Setlist');
        } else {
          // Initialize with empty setlist if no setlist is found
          setSetlist([]);
          setCurrentPlaylistName('Untitled Setlist');
        }
      } catch (error) {
        console.error('Error loading setlists and last used setlist:', error);
        setNotification({
          title: 'Error',
          message: 'Failed to load setlist: ' + error.message,
          variant: 'error'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    };

    loadSetlistsAndLastUsed();
  }, []);

  // Save setlist changes
  const saveSetlist = async (newSetlist) => {
    try {
      const response = await fetch('/api/setlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSetlist),
      });
      
      if (response.ok) {
        setSetlist(newSetlist);
      }
    } catch (error) {
      console.error('Error saving setlist:', error);
    }
  };

  // Save setlists changes
  const saveSetlists = async (newSetlists) => {
    try {
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setlists: newSetlists }),
      });

      if (!response.ok) throw new Error('Failed to save setlists');

      setSetlists(newSetlists);
    } catch (error) {
      console.error('Error saving setlists:', error);
    }
  };

  // Add polling for updates
  useEffect(() => {
    console.log('Setting up polling...');
    let lastUpdate = Date.now();
    let lastSongUpdate = Date.now();

    const pollForUpdates = async () => {
      try {
        // Check for setlist updates
        const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
        if (currentSetlistId) {
          const setlistResponse = await fetch('/api/setlists', {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          const data = await setlistResponse.json();
          
          if (data?.setlists?.[currentSetlistId]) {
            const serverSetlist = data.setlists[currentSetlistId];
            const serverTime = new Date(serverSetlist.updated || 0).getTime();

            if (serverTime > lastUpdate) {
              console.log('New setlist data detected, updating...');
              setSetlists(data.setlists);
              setSetlist(serverSetlist.setlist || []);
              lastUpdate = serverTime;
            }
          }
        }

        // Check for song updates
        const songResponse = await fetch('/api/songs', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const songData = await songResponse.json();
        const songUpdateTime = new Date(songData.updated || Date.now()).getTime();

        if (songUpdateTime > lastSongUpdate) {
          console.log('New song data detected, updating...');
          await loadSongs();
          lastSongUpdate = songUpdateTime;
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    };

    // Poll every second
    const intervalId = setInterval(pollForUpdates, 1000);
    
    // Initial poll
    pollForUpdates();

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array

  // Save changes immediately when setlist changes
  useEffect(() => {
    const saveChanges = async () => {
      try {
        const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
        if (!currentSetlistId || !setlists[currentSetlistId]) return;

        // Create updated setlists object
        const updatedSetlists = {
          ...setlists,
          [currentSetlistId]: {
            ...setlists[currentSetlistId],
            setlist: setlist,
            updated: new Date().toISOString() // Update timestamp
          }
        };

        // Save to server
        const response = await fetch('/api/setlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ setlists: updatedSetlists }),
        });

        if (!response.ok) {
          throw new Error('Failed to save setlists');
        }

        // Update local state
        setSetlists(updatedSetlists);
      } catch (error) {
        console.error('Error saving changes:', error);
      }
    };

    saveChanges();
  }, [setlist]); // Only depend on setlist changes

  // Load songs function
  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load songs');
      }
      const data = await response.json();
      
      // Transform the songs data structure
      const allSongs = [];
      
      // Handle all song categories
      if (data.song) {
        // Iterate through all categories
        Object.entries(data.song).forEach(([category, songs]) => {
          // Process songs in this category
          Object.entries(songs).forEach(([id, songData]) => {
            if (songData && songData.name) {
              // Parse tempo and duration as numbers
              const tempo = parseFloat(songData.tempo) || 0;
              const duration = parseInt(songData.duration) || 0;
              console.log('Loading song:', songData.name, 'with tempo:', tempo, 'duration:', duration); // Debug log
              
              allSongs.push({
                ...songData,
                id: id,
                setlistId: id,
                tempo: tempo,
                duration: duration
              });
            }
          });
        });
      }
      
      console.log('Total songs loaded:', allSongs.length); // Debug log
      setAvailableSongs(allSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to load songs: ' + error.message,
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Load songs when the component mounts
  useEffect(() => {
    loadSongs();
  }, []); // Empty dependency array means this runs once on mount

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: { y: 5 }, // Reduced from 8 to make it more responsive
        tolerance: { x: 20 }, // Allow some horizontal movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const animationModifiers = [
    restrictToVerticalAxis,
    (args) => {
      const newArgs = snapCenterToCursor(args);
      if (newArgs.transform) {
        return {
          ...newArgs,
          transform: {
            ...newArgs.transform,
            y: Math.round(newArgs.transform.y / 10) * 10 // Snap to 10px grid
          }
        };
      }
      return newArgs;
    }
  ];

  const handleDeleteClick = (song) => {
    console.log('Deleting song:', song); // Debug log
    setItemToDelete(song);
    setDeleteType('available');
    setShowDeleteConfirm(true);
  };

  const handleSetlistDelete = (setlistId, e) => {
    e?.stopPropagation();
    
    // Get the item from the setlist
    const itemToRemove = setlist.find(item => item.setlistId === setlistId);
    
    // If it's a set break, remove it immediately
    if (itemToRemove && itemToRemove.type === 'break') {
      setSetlist(prevSetlist => prevSetlist.filter(item => item.setlistId !== setlistId));
      return;
    }
    
    // For songs, show confirmation dialog
    setItemToDelete(itemToRemove);
    setDeleteType('setlist');
    setShowDeleteConfirm(true);
  };

  const handleSetlistDeleteConfirm = (setlistId) => {
    // Remove the song from setlist
    const updatedSetlist = setlist.filter(item => item.setlistId !== setlistId);
    setSetlist(updatedSetlist);

    // Save the updated setlist
    const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
    if (currentSetlistId) {
      const updatedSetlists = {
        ...setlists,
        [currentSetlistId]: {
          ...setlists[currentSetlistId],
          setlist: updatedSetlist,
          updated: new Date().toISOString()
        }
      };
      saveSetlists(updatedSetlists);
    }
    
    setNotification({
      title: 'Song Removed',
      message: 'Song removed from setlist but still available in your song library',
      variant: 'info'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    let hasError = false;

    try {
      if (deleteType === 'available') {
        // Delete from available songs
        console.log('Deleting song from available songs:', itemToDelete);

        // Make API call to delete the song first
        const response = await fetch('/api/songs', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            songId: itemToDelete.id,
            setlistId: itemToDelete.setlistId
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete song');
        }

        // Remove from available songs
        setAvailableSongs(prevSongs => prevSongs.filter(song => song.id !== itemToDelete.id));
        
        // Also remove from all setlists
        const updatedSetlists = {};
        for (const [setlistId, setlist] of Object.entries(setlists)) {
          updatedSetlists[setlistId] = {
            ...setlist,
            setlist: setlist.setlist.filter(item => 
              item.id !== itemToDelete.id || 
              item.setlistId !== itemToDelete.setlistId
            ),
            updated: new Date().toISOString()
          };
        }
        setSetlists(updatedSetlists);

        // Save the updated setlists
        const setlistsResponse = await fetch('/api/setlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ setlists: updatedSetlists }),
        });

        if (!setlistsResponse.ok) {
          throw new Error('Failed to update setlists');
        }

        setNotification({
          title: 'Success',
          message: 'Song permanently deleted from Available Songs',
          variant: 'success'
        });
      }
    } catch (error) {
      hasError = true;
      console.error('Error deleting song:', error);
      setNotification({
        title: 'Error',
        message: error.message || 'Failed to delete song',
        variant: 'error'
      });
    } finally {
      setTimeout(() => setNotification(null), 3000);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  const calculateSetDurations = () => {
    let sets = [];
    let currentSet = [];
    let currentDuration = 0;

    setlist.forEach((item) => {
      if (item.type === 'break') {
        if (currentSet.length > 0) {
          sets.push({
            songs: currentSet,
            duration: currentDuration
          });
        }
        currentSet = [];
        currentDuration = 0;
      } else {
        currentSet.push(item);
        currentDuration += parseInt(item.duration) || 0;
      }
    });

    // Add the last set if it exists
    if (currentSet.length > 0) {
      sets.push({
        songs: currentSet,
        duration: currentDuration
      });
    }

    return sets;
  };

  const formatTotalDuration = (totalSeconds) => {
    if (!totalSeconds) return '0:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateSetDuration = (breakId) => {
    let duration = 0;
    let currentSet = [];
    
    // Find all songs in the current set
    for (let i = setlist.length - 1; i >= 0; i--) {
      const item = setlist[i];
      if (item.setlistId === breakId) {
        break;
      }
      if (item.type === 'break') {
        currentSet = [];
      } else {
        currentSet.unshift(item);
      }
    }
    
    // Calculate total duration for the set
    return currentSet.reduce((acc, song) => acc + (parseInt(song.duration) || 0), 0);
  };

  const addBreak = async () => {
    try {
      const breakCount = setlist.filter(item => item.type === 'break').length + 1;
      const breakId = `break-${Date.now()}`;
      const newBreak = {
        type: 'break',
        setlistId: breakId,
        id: breakId,
        name: `Set ${breakCount}`
      };
      
      // Create new setlist with break inserted after current song
      const newSetlist = [...setlist];
      const currentIndex = newSetlist.findIndex(item => item.setlistId === selectedSongIds.values().next().value);
      
      // If no song is selected, add to the end
      if (currentIndex === -1) {
        newSetlist.push(newBreak);
      } else {
        // Add after the current song
        newSetlist.splice(currentIndex + 1, 0, newBreak);
      }
      
      setSetlist(newSetlist);

      // Get the current setlist ID
      const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
      if (!currentSetlistId) {
        throw new Error('No setlist selected');
      }

      // Update setlists state
      const updatedSetlists = {
        ...setlists,
        [currentSetlistId]: {
          ...setlists[currentSetlistId],
          setlist: newSetlist,
          updated: new Date().toISOString()
        }
      };
      setSetlists(updatedSetlists);

      // Save to backend
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setlists: updatedSetlists }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setlist');
      }

      setNotification({
        title: 'Success',
        message: `Added ${newBreak.name}`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Error adding break:', error);
      setNotification({
        title: 'Error',
        message: error.message || 'Failed to add break',
        variant: 'error'
      });
      // Revert setlist state on error
      setSetlist(setlist);
    } finally {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const updateSetNumbers = () => {
    const updatedSetlist = [...setlist];
    let setNumber = 1;
    
    // Go through the list from top to bottom
    for (let i = 0; i < updatedSetlist.length; i++) {
      if (updatedSetlist[i].type === 'break') {
        updatedSetlist[i].name = `Set ${setNumber}`;
        setNumber++;
      }
    }
    
    setSetlist(updatedSetlist);
  };

  // Update set numbers whenever the setlist changes
  useEffect(() => {
    updateSetNumbers();
  }, [setlist.length]);

  const addToSetlist = (song) => {
    // Get the original song data to ensure we have all properties
    const originalSong = availableSongs.find(s => s.id === song.id || s.setlistId === song.setlistId);
    if (!originalSong) {
      console.error('Original song not found:', song);
      return;
    }

    const setlistId = `${originalSong.id || originalSong.setlistId}-${Date.now()}`;
    const songWithLyrics = {
      ...originalSong, // Use all properties from the original song
      setlistId, // Only override the setlistId for the setlist entry
      id: originalSong.id || originalSong.setlistId, // Preserve the original ID
    };
    
    console.log('Adding song to setlist:', songWithLyrics); // Debug log
    setSetlist(prev => [songWithLyrics, ...prev]);
    setSearchTerm(''); // Clear search after adding song
  };

  const removeFromSetlist = (setlistId) => {
    setSetlist(setlist.filter(song => song.setlistId !== setlistId));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // Only proceed if we have both an active and over item and they're different
    if (!active || !over || active.id === over.id) {
      setSelectedSongIds(new Set());
      lastSelectedId.current = null;
      return;
    }

    const oldIndex = setlist.findIndex(item => item.setlistId === active.id);
    const newIndex = setlist.findIndex(item => item.setlistId === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      setSelectedSongIds(new Set());
      lastSelectedId.current = null;
      return;
    }

    try {
      // Create new array with the moved item
      const newSetlist = arrayMove([...setlist], oldIndex, newIndex);
      
      // Get the current setlist ID
      const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
      if (!currentSetlistId) {
        throw new Error('No setlist selected');
      }

      // Create updated setlists object
      const updatedSetlists = {
        ...setlists,
        [currentSetlistId]: {
          ...setlists[currentSetlistId],
          setlist: newSetlist,
          updated: new Date().toISOString()
        }
      };

      // Update server first
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setlists: updatedSetlists }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setlist order');
      }

      // Only update local state after successful server update
      setSetlists(updatedSetlists);
      setSetlist(newSetlist);
    } catch (error) {
      console.error('Error updating setlist order:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to update setlist order',
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      // Clear selections
      setSelectedSongIds(new Set());
      lastSelectedId.current = null;
    }
  };

  const handleSongClick = (setlistId, e) => {
    if (e) e.stopPropagation();
    if (editMode === 'show') {
      const clickedSong = setlist.find(item => item.setlistId === setlistId);
      if (clickedSong?.type !== 'break') {
        handleFlashEffect(setlistId, clickedSong.tempo);
      }
      return;
    } else {
      e?.stopPropagation();
      const shiftPressed = e.shiftKey;
      const ctrlPressed = e.ctrlKey || e.metaKey;
      if (shiftPressed) {
        // Select all songs between the last selected and the current one
        const lastSelectedIndex = setlist.findIndex(item => item.setlistId === lastSelectedId.current);
        const currentIndex = setlist.findIndex(item => item.setlistId === setlistId);
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        const newSelection = new Set(setlist.slice(start, end + 1).map(item => item.setlistId));
        setSelectedSongIds(newSelection);
        lastSelectedId.current = setlistId;
      } else if (ctrlPressed) {
        // Toggle selection
        if (selectedSongIds.has(setlistId)) {
          setSelectedSongIds(prev => new Set([...prev].filter(id => id !== setlistId)));
        } else {
          setSelectedSongIds(prev => new Set([...prev, setlistId]));
        }
        lastSelectedId.current = setlistId;
      } else {
        // Single select
        setSelectedSongIds(new Set([setlistId]));
        lastSelectedId.current = setlistId;
      }
    }
  };

  const handleDragStart = useCallback((e, setlistId) => {
    if (!selectedSongIds.has(setlistId)) {
      setSelectedSongIds(new Set([setlistId]));
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({
      setlistIds: Array.from(selectedSongIds),
      startIndex: setlistId
    }));
  }, [selectedSongIds]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const setlistIds = data.setlistIds.sort((a, b) => a - b);
    
    // Create a new setlist without the dragged items
    const newSetlist = setlist.filter((_, index) => !selectedSongIds.has(setlist[index].setlistId));
    
    // Calculate the adjusted drop index
    let adjustedDropIndex = dropIndex;
    setlistIds.forEach(setlistId => {
      if (setlistId < dropIndex) {
        // When moving down, adjust the insert position
        adjustedDropIndex--;
      }
    });
    
    // Get the items being moved
    const movedItems = setlistIds.map(setlistId => setlist.find(item => item.setlistId === setlistId));
    
    // Insert the moved items at the calculated position
    newSetlist.splice(adjustedDropIndex, 0, ...movedItems);
    setSetlist(newSetlist);
  }, [selectedSongIds, setlist]);

  const addSong = async (songData) => {
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      });

      if (!response.ok) {
        throw new Error('Failed to add song');
      }

      const { song, message } = await response.json();

      // Update the setlist with the new song
      const newSetlist = [...setlist, song];
      setSetlist(newSetlist);

      // Show the success notification
      setNotification({
        title: 'Success',
        message,
        variant: 'success',
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error adding song:', error);
      setNotification({
        title: 'Error',
        message: error.message || 'Failed to add song',
        variant: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEditSong = async (songId, songData) => {
    try {
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId, songData }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit song');
      }

      // Update the song in available songs
      setAvailableSongs(prevSongs =>
        prevSongs.map(song =>
          song.id === songId ? { ...song, ...songData[songId] } : song
        )
      );

      // Update the song in setlist if it exists there
      setSetlist(prevSetlist =>
        prevSetlist.map(song =>
          song.id === songId ? songToEdit : song
        )
      );

      setShowEditForm(false);
      setSongToEdit(null);
      setSearchTerm(''); // Clear search after editing
    } catch (error) {
      console.error('Error editing song:', error);
    }
  };

  const handleRemoveFromSetlist = (songId) => {
    const songName = availableSongs.find(song => song.id === songId)?.name;
    const setlistName = currentPlaylistName;

    setSetlist(prevSetlist => prevSetlist.filter(item => item.id !== songId));

    setNotification({
      title: 'Success',
      message: `"${songName}" added to "${setlistName}"`,
      variant: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
    setSearchTerm(''); // Clear search after removing from setlist
  };

  const handleDeleteSong = async (songId) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this song from Available Songs? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch('/api/songs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: songToEdit.id }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete song');
      }

      // Remove song from available songs
      setAvailableSongs(prevSongs => prevSongs.filter(song => song.id !== songToEdit.id));
      
      // Also remove from setlist if it exists there
      setSetlist(prevSetlist => prevSetlist.filter(item => item.id !== songToEdit.id));

      // Close the edit form and clear search
      setShowEditForm(false);
      setSongToEdit(null);
      setSearchTerm('');

      setNotification({
        title: 'Success',
        message: 'Song permanently deleted from Available Songs',
        variant: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting song:', error);
      setNotification({
        title: 'Error',
        message: error.message || 'Failed to delete song',
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
      setShowEditForm(false);
      setSongToEdit(null);
    }
  };

  const handleSavePlaylist = async () => {
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      setlist: [{
        type: 'break',
        setlistId: `break-${Date.now()}`,
        id: `break-${Date.now()}`,
        name: 'Set 1'
      }],
      updated: new Date().toISOString()
    };

    try {
      // Create updated setlists object with the new setlist
      const updatedSetlists = {
        ...setlists,
        [newPlaylist.id]: newPlaylist
      };

      // Save to server
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setlists: updatedSetlists }),
      });

      if (!response.ok) {
        throw new Error('Failed to create setlist');
      }

      // Update local state
      setSetlists(updatedSetlists);
      setNewPlaylistName('');
      setShowNewPlaylistDialog(false);

      // Show success notification
      setNotification({
        title: 'Success',
        message: `Created new setlist "${newPlaylist.name}"`,
        variant: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error creating setlist:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to create setlist',
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleOverwritePlaylist = (playlistId, playlistName) => {
    setPlaylistToOverwrite({ id: playlistId, name: playlistName });
    setShowOverwriteConfirm(true);
  };

  const confirmOverwrite = async () => {
    if (playlistToOverwrite) {
      try {
        const response = await fetch(`/api/setlists/${playlistToOverwrite.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: playlistToOverwrite.name,
            setlist: setlist,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update setlist');
        }

        const updatedSetlists = {
          ...setlists,
          [playlistToOverwrite.id]: {
            name: playlistToOverwrite.name,
            setlist: setlist,
          },
        };
        setSetlists(updatedSetlists);
        setShowManageSetlists(false);
      } catch (error) {
        console.error('Error updating setlist:', error);
      }
    }
    setShowOverwriteConfirm(false);
    setPlaylistToOverwrite(null);
  };

  const handleLoadPlaylist = (playlistId) => {
    const playlist = setlists[playlistId];
    if (playlist) {
      setSetlist(playlist.setlist || []);
      setCurrentPlaylistName(playlist.name);
      setShowManageSetlists(false);
      // Save the last used playlist ID
      localStorage.setItem('lastUsedSetlistId', playlistId);
    }
  };

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    setPlaylistToDelete({ id: playlistId, name: playlistName });
    setShowPlaylistDeleteConfirm(true);
  };

  const confirmPlaylistDelete = async () => {
    if (playlistToDelete) {
      try {
        // Remove playlist from local state
        const updatedSetlists = { ...setlists };
        delete updatedSetlists[playlistToDelete.id];

        // Save the updated setlists to the server
        const response = await fetch('/api/setlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ setlists: updatedSetlists }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete setlist');
        }

        // Update local state
        setSetlists(updatedSetlists);

        // If we deleted the current playlist, reset to empty setlist
        const currentPlaylistId = localStorage.getItem('lastUsedSetlistId');
        if (currentPlaylistId === playlistToDelete.id) {
          setSetlist([]);
          setCurrentPlaylistName('Untitled Setlist');
          localStorage.removeItem('lastUsedSetlistId');
        }

        // Show success notification
        setNotification({
          title: 'Success',
          message: `Setlist "${playlistToDelete.name}" has been deleted`,
          variant: 'success'
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error deleting setlist:', error);
        setNotification({
          title: 'Error',
          message: 'Failed to delete setlist',
          variant: 'error'
        });
        setTimeout(() => setNotification(null), 3000);
      } finally {
        // Reset delete dialog state
        setShowPlaylistDeleteConfirm(false);
        setPlaylistToDelete(null);
      }
    }
  };

  const handleRenameClick = (playlist, playlistId) => {
    setSetlistToRename({ ...playlist, id: playlistId });
    setNewSetlistName(playlist.name);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async () => {
    if (setlistToRename?.id) {
      try {
        const updatedSetlists = {
          ...setlists,
          [setlistToRename.id]: {
            ...setlists[setlistToRename.id],
            name: newSetlistName,
            updated: new Date().toISOString()
          }
        };

        // Save to server
        const response = await fetch('/api/setlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ setlists: updatedSetlists }),
        });

        if (!response.ok) {
          throw new Error('Failed to save setlist');
        }

        // Update local state
        setSetlists(updatedSetlists);
        setCurrentPlaylistName(newSetlistName);
        setShowRenameDialog(false);
        setSetlistToRename(null);

        setNotification({
          title: 'Success',
          message: 'Setlist renamed successfully',
          variant: 'success'
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error renaming setlist:', error);
        setNotification({
          title: 'Error',
          message: 'Failed to rename setlist',
          variant: 'error'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  const handleRenameConfirmDialog = () => {
    handleRenameConfirm();
    setShowRenameDialog(false);
    setSetlistToRename(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            songId: songToEdit.id,
            songData: { 
              [songToEdit.id]: {
                ...songToEdit,
                date_updated: new Date().toISOString()
              }
            }
          }),
      });

      if (!response.ok) {
        throw new Error('Failed to update song');
      }

      // Update the song in available songs
      setAvailableSongs(prevSongs =>
        prevSongs.map(song =>
          song.id === songToEdit.id ? songToEdit : song
        )
      );

      // Update the song in setlist if it exists there
      setSetlist(prevSetlist =>
        prevSetlist.map(song =>
          song.id === songToEdit.id ? songToEdit : song
        )
      );

      // Close the form
      setShowEditForm(false);
      setSongToEdit(null);

      // Show success notification
      setNotification({
        title: 'Success',
        message: 'Song updated successfully',
        variant: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
      setSearchTerm(''); // Clear search after editing
    } catch (error) {
      console.error('Error updating song:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to update song',
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleManualSave = async () => {
    try {
      // Get the current setlist ID
      const currentSetlistId = localStorage.getItem('lastUsedSetlistId');
      if (!currentSetlistId || !setlists[currentSetlistId]) {
        throw new Error('No setlist selected');
      }

      // Update the current setlist
      const updatedSetlists = {
        ...setlists,
        [currentSetlistId]: {
          ...setlists[currentSetlistId],
          setlist: setlist,
          updated: new Date().toISOString()
        }
      };

      // Save to setlists API
      const setlistsResponse = await fetch('/api/setlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ setlists: updatedSetlists }),
      });

      if (!setlistsResponse.ok) {
        throw new Error('Failed to save to setlists');
      }

      // Update local state
      setSetlists(updatedSetlists);

      setNotification({
        title: 'Success',
        message: `Saved to "${setlists[currentSetlistId].name}"`,
        variant: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving setlist:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to save setlist: ' + error.message,
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple refreshes
    
    setIsRefreshing(true);
    try {
      // Load all setlists and songs in parallel
      const [setlistsResponse, songsResponse] = await Promise.all([
        fetch('/api/setlists', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch('/api/songs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ]);

      if (!setlistsResponse.ok) {
        throw new Error('Failed to load setlists');
      }
      if (!songsResponse.ok) {
        throw new Error('Failed to load songs');
      }

      // Process setlists
      const setlistsData = await setlistsResponse.json();
      const loadedSetlists = setlistsData.setlists || {};
      setSetlists(loadedSetlists);

      // Process songs using the same logic as loadSongs
      const songsData = await songsResponse.json();
      const allSongs = [];
      
      // Handle all song categories
      if (songsData.song) {
        // Iterate through all categories
        Object.entries(songsData.song).forEach(([category, songs]) => {
          // Process songs in this category
          Object.entries(songs).forEach(([id, songGroup]) => {
            // Get the actual song data from the nested structure
            const songData = songGroup[id];
            if (songData && songData.name) {
              // Parse tempo and duration as numbers
              const tempo = parseFloat(songData.tempo) || 0;
              const duration = parseInt(songData.duration) || 0;
              console.log('Loading song:', songData.name, 'with tempo:', tempo, 'duration:', duration); // Debug log
              
              allSongs.push({
                ...songData,
                id: id,
                setlistId: id,
                tempo: tempo,
                duration: duration
              });
            }
          });
        });
      }
      
      console.log('Total songs loaded:', allSongs.length); // Debug log
      setAvailableSongs(allSongs);

      // Get last used setlist ID from localStorage
      const lastUsedSetlistId = localStorage.getItem('lastUsedSetlistId') || 'current';
      
      if (lastUsedSetlistId && loadedSetlists[lastUsedSetlistId]) {
        // Load the last used setlist
        const setlist = loadedSetlists[lastUsedSetlistId];
        setSetlist(setlist.setlist || []);
        setCurrentPlaylistName(setlist.name || 'Untitled Setlist');
      }

      setNotification({
        title: 'Refreshed!',
        message: `Updated at ${new Date().toLocaleTimeString()}`,
        variant: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error refreshing:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to refresh: ' + error.message,
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Add useEffect to handle body overflow
  useEffect(() => {
    if (showAddForm || showNewSongForm || showEditForm || showManageSetlists) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAddForm, showNewSongForm, showEditForm, showManageSetlists]);

  // Add polling for edit mode status
  useEffect(() => {
    const pollEditMode = async () => {
      try {
        const response = await fetch('/api/edit-mode', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
        
        // Update local edit mode based on server state
        if (data.masterDevice) {
          if (data.masterDevice === localStorage.getItem('deviceId')) {
            setEditMode('edit');
            setIsMaster(true);
          } else {
            setEditMode('locked');
            setIsMaster(false);
          }
        } else {
          setEditMode('show');
          setIsMaster(false);
        }
      } catch (error) {
        console.error('Error polling edit mode:', error);
      }
    };

    const intervalId = setInterval(pollEditMode, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Initialize device ID on mount
  useEffect(() => {
    const deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      const newDeviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', newDeviceId);
    }
  }, []);

  const toggleEditMode = async () => {
    try {
      if (editMode === 'show') {
        // Try to become master
        const response = await fetch('/api/edit-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: localStorage.getItem('deviceId'),
            action: 'claim'
          }),
        });
        
        if (response.ok) {
          setEditMode('edit');
          setIsMaster(true);
        }
      } else if (editMode === 'edit' && isMaster) {
        // Release master status
        await fetch('/api/edit-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: localStorage.getItem('deviceId'),
            action: 'release'
          }),
        });
        
        setEditMode('show');
        setIsMaster(false);
      }
    } catch (error) {
      console.error('Error toggling edit mode:', error);
      setNotification({
        title: 'Error',
        message: 'Failed to change edit mode',
        variant: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleTouchStart = (e) => {
    // Prevent scrolling when starting to drag
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    // Prevent scrolling during drag
    e.preventDefault();
  };

  const handleBreakClick = () => {
    setSelectedSongIds(new Set());
    lastSelectedId.current = null;
  };

  // Function to get break number
  const getBreakNumber = (currentIndex) => {
    return setlist.slice(0, currentIndex + 1)
      .filter(item => item.type === 'break')
      .length;
  };

  // Clean up interval on unmount or when changing songs
  useEffect(() => {
    return () => {
      if (flashingIntervalRef.current) {
        clearInterval(flashingIntervalRef.current);
        flashingIntervalRef.current = null;
      }
    };
  }, []);

  const handleAddSet = (setlistId) => {
    const newBreak = {
      type: 'break',
      setlistId: `break-${Date.now()}`,
      id: `break-${Date.now()}`,
      name: `Set ${getBreakNumber(setlist.findIndex(item => item.setlistId === setlistId)) + 1}`,
    };

    // Find the index of the current break
    const currentIndex = setlist.findIndex(item => item.setlistId === setlistId);
    
    // Insert the new break right after the current one
    const newSetlist = [
      ...setlist.slice(0, currentIndex + 1),
      newBreak,
      ...setlist.slice(currentIndex + 1)
    ];

    setSetlist(newSetlist);
  };

  // Filter songs based on search term
  const filteredSongs = useMemo(() => {
    return availableSongs
      .filter((song) =>
        song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by song name
  }, [availableSongs, searchTerm]);

  return (
    <main className="min-h-screen w-full max-w-full bg-black text-white overflow-hidden">
      <div className="flex flex-col h-screen">
        {/* Fixed Header */}
        <header className="w-full bg-gray-900 border-b border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 px-4 py-3">
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">{currentPlaylistName}</h1>
                <div className="relative">
                  <Menu 
                    onRefresh={handleRefresh}
                    onManageSongs={() => setShowAddForm(true)}
                    onManageSetlists={() => setShowManageSetlists(true)}
                    onAddBreak={addBreak}
                    isRefreshing={isRefreshing}
                  />
                </div>
              </div>
              
              {/* Controls Row */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleEditMode}
                  className={`text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground ${editMode === 'show' ? 'text-gray-500' : editMode === 'edit' ? 'text-green-500' : 'text-red-500'}`}
                  disabled={editMode === 'locked'}
                >
                  {editMode === 'show' ? (
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      Show Mode
                    </div>
                  ) : editMode === 'edit' ? (
                    <div className="flex items-center gap-1.5">
                      <Edit className="h-4 w-4" />
                      Edit Mode (Master)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      Locked
                    </div>
                  )}
                </button>
                <div className="flex items-center gap-4 text-base text-gray-400">
                  <span>{setlist.filter(item => item.type !== 'break').length} songs</span>
                  <span>{formatTotalDuration(setlist.reduce((acc, song) => acc + (song.type !== 'break' ? parseInt(song.duration) || 0 : 0), 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-black">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Setlist Content */}
            {editMode !== 'edit' ? (
              <div className="space-y-2">
                {setlist.map((item, index) => (
                  <div 
                    key={item.setlistId}
                    onClick={() => item.type !== 'break' && handleSongClick(item.setlistId)}
                    className={`w-full p-2 rounded-lg shadow-sm ${
                      item.type === 'break' 
                        ? 'bg-red-900' 
                        : selectedSongIds.has(item.setlistId)
                          ? 'bg-gray-800'
                          : flashingSongId === item.setlistId
                            ? 'bg-yellow-500 text-black'
                            : 'bg-black hover:bg-gray-900'
                    } text-white border-b border-white/10 mb-1 cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'break' ? (
                          <p className="font-medium text-xl text-white">Set {getBreakNumber(index)} ({formatDuration(calculateSetDuration(item.setlistId))})</p>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <p className={`font-medium text-2xl ${flashingSongId === item.setlistId ? 'text-black' : 'text-white'}`}>{item.name}</p>
                            <p className={`text-xs ${flashingSongId === item.setlistId ? 'text-black/70' : 'text-muted-foreground'}`}>
                              {item.artist} • {formatDuration(item.duration)} • {item.tempo || 'No'} BPM
                            </p>
                          </div>
                        )}
                      </div>
                      {item.type !== 'break' && (
                        <button
                          onClick={() => {
                            // Find the complete song data from availableSongs using the original ID
                            const originalId = item.id || item.setlistId.split('-')[0]; // Extract original ID from setlistId
                            const completeData = availableSongs.find(s => s.id === originalId) || item;
                            console.log('Setting selected song:', completeData); // Debug log
                            setSelectedSong({
                              ...completeData,
                              setlistId: item.setlistId // Preserve the setlist-specific ID
                            });
                            setViewingSongId(item.setlistId);
                            setShowLyrics(true);
                          }}
                          className="p-2 text-white hover:text-white/80 transition-colors rounded-full"
                        >
                          <FileText2 className="h-6 w-6 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDragCancel={() => {
                  setSelectedSongIds(new Set());
                  lastSelectedId.current = null;
                }}
                collisionDetection={closestCenter}
                modifiers={animationModifiers}
                measuring={{
                  droppable: {
                    strategy: MeasuringStrategy.Always
                  }
                }}
              >
                <SortableContext items={setlist.map(item => item.setlistId)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {setlist.map((item, index) => {
                      if (item.type === 'break') {
                        return (
                          <SortableItem key={item.setlistId} id={item.setlistId}>
                            <div 
                              onTouchStart={!editMode === 'show' ? handleTouchStart : undefined}
                              onTouchMove={!editMode === 'show' ? handleTouchMove : undefined}
                              onClick={handleBreakClick}
                              className={`flex items-center justify-between w-full p-2 bg-red-900 hover:bg-red-800 rounded-lg shadow-sm ${editMode === 'show' ? 'cursor-default' : 'cursor-move'} touch-none border border-white/10 mb-1`}
                            >
                              <div className="flex items-center gap-4">
                                {editMode !== 'show' && (
                                  <div className="flex flex-col items-center gap-2 text-white hover:text-white/80">
                                    <ChevronUp
                                      className="h-4 w-4 text-white"
                                      onTouchStart={handleTouchStart}
                                      onTouchMove={handleTouchMove}
                                    />
                                    <ChevronDown
                                      className="h-4 w-4 text-white"
                                      onTouchStart={handleTouchStart}
                                      onTouchMove={handleTouchMove}
                                    />
                                  </div>
                                )}
                                <p className="font-medium text-2xl text-white">Set {getBreakNumber(index)} ({formatDuration(calculateSetDuration(item.setlistId))})</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => {
                                    handleAddSet(item.setlistId);
                                  }}
                                  className="p-2 text-white hover:text-white/80 transition-colors rounded-full"
                                >
                                  <Coffee className="h-6 w-6 text-white" />
                                </button>
                                {editMode !== 'show' && (
                                  <button
                                    onClick={(e) => handleSetlistDelete(item.setlistId, e)}
                                    className="p-2 text-white hover:text-white/80 transition-colors rounded-full"
                                  >
                                    <Trash2 className="h-6 w-6 text-white" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </SortableItem>
                        );
                      }
                      return (
                        <SortableItem key={item.setlistId} id={item.setlistId}>
                          <div 
                            onClick={(e) => handleSongClick(item.setlistId, e)}
                            onTouchStart={editMode !== 'show' ? handleTouchStart : undefined}
                            onTouchMove={editMode !== 'show' ? handleTouchMove : undefined}
                            className={`flex items-center justify-between w-full p-2 ${
                              selectedSongIds.has(item.setlistId)
                                ? 'bg-gray-800'
                                : flashingSongId === item.setlistId
                                  ? 'bg-yellow-500 text-black'
                                  : 'bg-black hover:bg-gray-900'
                            } rounded-lg shadow-sm ${editMode === 'show' ? 'cursor-default' : 'cursor-move'} touch-none border border-white/10 mb-1`}
                          >
                            <div className="flex items-center gap-1.5">
                              {editMode !== 'show' && (
                                <div className="flex flex-col items-center gap-2 text-white hover:text-white/80">
                                  <ChevronUp
                                    className="h-4 w-4 text-white"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                  />
                                  <ChevronDown
                                    className="h-4 w-4 text-white"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                  />
                                </div>
                              )}
                              <div className="flex flex-col gap-0.5">
                                <p className={`font-medium text-2xl ${flashingSongId === item.setlistId ? 'text-black' : 'text-white'}`}>{item.name}</p>
                                <p className={`text-xs ${flashingSongId === item.setlistId ? 'text-black/70' : 'text-muted-foreground'}`}>
                                  {item.artist} • {formatDuration(item.duration)} • {item.tempo || 'No'} BPM
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleSetlistDelete(item.setlistId, e)}
                                className="p-2 hover:bg-gray-800 rounded-md text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-6 w-6 text-white" />
                              </button>
                              {editMode !== 'edit' && (
                                <button
                                  onClick={() => {
                                    // Find the complete song data from availableSongs using the original ID
                                    const originalId = item.id || item.setlistId.split('-')[0]; // Extract original ID from setlistId
                                    const completeData = availableSongs.find(s => s.id === originalId) || item;
                                    console.log('Setting selected song:', completeData); // Debug log
                                    setSelectedSong({
                                      ...completeData,
                                      setlistId: item.setlistId // Preserve the setlist-specific ID
                                    });
                                    setViewingSongId(item.setlistId);
                                    setShowLyrics(true);
                                  }}
                                  className="p-2 hover:bg-gray-800 rounded-md text-blue-400 hover:text-blue-300"
                                >
                                  <FileText2 className="h-6 w-6 text-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            {setlist.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Menu2 className="h-12 w-12 mb-4 text-yellow-500" />
                <h3 className="text-xl font-medium text-gray-200 mb-2">This setlist is empty</h3>
                <p className="text-gray-400 mb-6">Click the menu button in the top right to add songs or a break</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LyricsModal
        isOpen={showLyrics}
        onClose={() => {
          setShowLyrics(false);
          setSelectedSong(null);
          setViewingSongId(null);
        }}
        song={selectedSong}
      />

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Manage Songs</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="h-6 w-6" /> {/* Use the right arrow icon without rotation */}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                  {/* Add New Song Button */}
                  <button
                    onClick={() => setShowNewSongForm(true)}
                    className="w-full p-3 bg-green-600 hover:bg-green-700 border border-green-500 rounded-md flex items-center justify-center gap-2 text-sm text-white mb-6"
                  >
                    <Plus className="h-6 w-6 text-white" />
                    Add New Song
                  </button>

                  {/* Search */}
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search songs..."
                      className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                      <Music4 className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Songs List */}
                  <div className="space-y-2">
                    {filteredSongs.map((song) => {
                      const isInSetlist = setlist.some(item => 
                        !item.type && // Ignore breaks
                        item.id === song.id
                      );

                      return (
                        <div
                          key={song.id}
                          className={`flex items-center justify-between p-4 bg-black hover:bg-gray-900 rounded-md border border-white/10 ${isInSetlist ? 'opacity-50' : ''}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-2xl font-medium text-white">{song.name}</span>
                            <span className="text-sm text-gray-400">{song.artist}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => !isInSetlist && addToSetlist(song)}
                              className={`p-2 hover:bg-gray-800 rounded-md ${isInSetlist ? 'text-green-400' : 'text-gray-400 hover:text-green-300'}`}
                              disabled={isInSetlist}
                            >
                              {isInSetlist ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                                  <circle cx="12" cy="12" r="10" className="stroke-current" fill="none" />
                                  <path d="M8 12l3 3 6-6" className="stroke-current" strokeWidth="2" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                                  <circle cx="12" cy="12" r="10" className="stroke-current" fill="none" />
                                  <path d="M12 8v8M8 12h8" className="stroke-current" strokeWidth="2" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(song)}
                              className="p-2 hover:bg-gray-800 rounded-md text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-6 w-6 text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewSongForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Add New Song</h2>
                <button
                  onClick={() => setShowNewSongForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <AddSongForm onAddSong={addSong} onClose={() => setShowNewSongForm(false)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Edit Song</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setSongToEdit(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <EditSongForm 
                    song={songToEdit} 
                    onEditSong={handleEditSong} 
                    onClose={() => {
                      setShowEditForm(false);
                      setSongToEdit(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageSetlists && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold">Manage Setlists</h2>
                <button
                  onClick={() => setShowManageSetlists(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="h-6 w-6" /> {/* Use the right arrow icon without rotation */}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                  {/* Create New Setlist */}
                  <button
                    onClick={() => setShowNewPlaylistDialog(true)}
                    className="w-full p-3 bg-green-600 hover:bg-green-700 border border-green-500 rounded-md flex items-center justify-center gap-2 text-sm text-white"
                  >
                    <Plus className="h-6 w-6 text-white" />
                    Create New Setlist
                  </button>

                  {/* Setlists List */}
                  <div className="space-y-2 mt-6">
                    {Object.entries(setlists).map(([id, playlist]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between p-3 bg-black hover:bg-gray-900 rounded-md border border-white/10"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-2xl text-white">{playlist.name}</span>
                          <span className="text-sm text-gray-400">
                            {playlist.setlist?.length || 0} songs
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleLoadPlaylist(id);
                              setShowManageSetlists(false);
                            }}
                            className="p-2 hover:bg-gray-800 rounded-md text-blue-400 hover:text-blue-300"
                          >
                            <FolderOpen className="h-6 w-6 text-white" />
                          </button>
                          <button
                            onClick={() => handleRenameClick(playlist, id)}
                            className="p-2 hover:bg-gray-800 rounded-md text-yellow-400 hover:text-yellow-300"
                          >
                            <Edit className="h-6 w-6 text-white" />
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(id, playlist.name)}
                            className="p-2 hover:bg-gray-800 rounded-md text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-6 w-6 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">
                  {deleteType === 'available' ? 'Delete Song Permanently' : 'Remove from Setlist'}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                    setDeleteType(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  {deleteType === 'available' ? (
                    <>
                      <div className="bg-red-950/50 p-4 rounded-lg border border-red-800/50">
                        <p className="text-red-400 font-medium flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Warning: This action cannot be undone
                        </p>
                      </div>
                      <div className="bg-gray-900 rounded-lg border border-white/10 p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Are you sure you want to delete this song?</h3>
                        <p className="text-xl text-red-300 font-semibold mb-4">"{itemToDelete?.name}"</p>
                        <p className="text-gray-400">This will permanently remove the song from:</p>
                        <ul className="mt-2 space-y-2 text-gray-400">
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Your song library
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            All setlists
                          </li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-900 rounded-lg border border-white/10 p-6">
                      <h3 className="text-lg font-medium text-white mb-4">Remove from current setlist?</h3>
                      <p className="text-xl text-blue-300 font-semibold mb-4">"{itemToDelete?.name}"</p>
                      <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-800/30">
                        <p className="text-sm text-blue-300 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Note: The song will still be available in your song library and other setlists.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setItemToDelete(null);
                        setDeleteType(null);
                      }}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white border border-white/10 py-3 px-4 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (deleteType === 'available') {
                          handleDeleteConfirm();
                        } else if (itemToDelete) {
                          handleSetlistDeleteConfirm(itemToDelete.setlistId);
                        }
                        setShowDeleteConfirm(false);
                        setItemToDelete(null);
                        setDeleteType(null);
                      }}
                      className={`flex-1 py-3 px-4 rounded-md transition-colors ${
                        deleteType === 'available'
                          ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
                      }`}
                    >
                      {deleteType === 'available' ? 'Delete Permanently' : 'Remove from Setlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPlaylistDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Delete Setlist</h2>
                <button
                  onClick={() => {
                    setShowPlaylistDeleteConfirm(false);
                    setPlaylistToDelete(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-red-950/50 p-4 rounded-lg border border-red-800/50">
                    <p className="text-red-400 font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Warning: This action cannot be undone
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg border border-white/10 p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Are you sure you want to delete this setlist?</h3>
                    <p className="text-xl text-red-300 font-semibold mb-4">"{playlistToDelete?.name}"</p>
                    <p className="text-gray-400">This will permanently delete:</p>
                    <ul className="mt-2 space-y-2 text-gray-400">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        The entire setlist and its order
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        All set breaks and organization
                      </li>
                    </ul>
                    <div className="mt-4 bg-blue-950/30 p-4 rounded-lg border border-blue-800/30">
                      <p className="text-sm text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Note: The songs themselves will still be available in your song library.
                      </p>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowPlaylistDeleteConfirm(false);
                        setPlaylistToDelete(null);
                      }}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 text-white border border-white/10 py-3 px-4 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmPlaylistDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-500 py-3 px-4 rounded-md transition-colors"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNewPlaylistDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Create New Setlist</h2>
                <button
                  onClick={() => {
                    setShowNewPlaylistDialog(false);
                    setNewPlaylistName('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-gray-900 rounded-lg border border-white/10 p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                          Setlist Name
                        </Label>
                        <Input
                          id="name"
                          value={newPlaylistName || ''}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Enter a name for your setlist"
                          className="mt-2"
                        />
                      </div>
                      <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-800/30">
                        <p className="text-sm text-blue-300 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          You can add songs and organize them into sets after creating the setlist.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Button */}
                  <div className="flex">
                    <button
                      onClick={() => {
                        handleSavePlaylist();
                        setShowNewPlaylistDialog(false);
                      }}
                      disabled={!newPlaylistName || newPlaylistName.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border border-green-500 py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Setlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out safe-top">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex justify-between items-center bg-gray-900 border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold text-white">Rename Setlist</h2>
                <button
                  onClick={() => {
                    setShowRenameDialog(false);
                    setSetlistToRename(null);
                    setNewSetlistName("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-gray-900 rounded-lg border border-white/10 p-6">
                    <div className="space-y-4">
                      <Label htmlFor="newName" className="text-white text-sm">
                        Setlist Name
                      </Label>
                      <Input
                        id="newName"
                        value={newSetlistName}
                        onChange={(e) => setNewSetlistName(e.target.value)}
                        className="bg-black border-white/10 text-white"
                        placeholder="Enter setlist name"
                      />
                      <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-800/30 mt-4">
                        <p className="text-sm text-blue-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          This will rename "{setlistToRename?.name}" to your new name.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Button */}
                  <div className="flex">
                    <button
                      onClick={async () => {
                        if (setlistToRename?.id) {
                          try {
                            const updatedSetlists = {
                              ...setlists,
                              [setlistToRename.id]: {
                                ...setlists[setlistToRename.id],
                                name: newSetlistName,
                                updated: new Date().toISOString()
                              }
                            };

                            // Save to server
                            const response = await fetch('/api/setlists', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ setlists: updatedSetlists }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to save setlist');
                            }

                            // Update local state
                            setSetlists(updatedSetlists);
                            setCurrentPlaylistName(newSetlistName);
                            setShowRenameDialog(false);
                            setSetlistToRename(null);

                            setNotification({
                              title: 'Success',
                              message: 'Setlist renamed successfully',
                              variant: 'success'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          } catch (error) {
                            console.error('Error renaming setlist:', error);
                            setNotification({
                              title: 'Error',
                              message: 'Failed to rename setlist',
                              variant: 'error'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }
                        }
                      }}
                      disabled={!newSetlistName || newSetlistName.length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border border-green-500 py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rename Setlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
