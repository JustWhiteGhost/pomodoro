// screens/NotesScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const scale = width / 375;

const normalize = (size) => {
  return Math.round(size * scale);
};

export default function NotesScreen() {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const openNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(true);
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  const saveNote = () => {
    if (noteTitle.trim() && noteContent.trim()) {
      if (editingNote) {
        updateNote(editingNote.id, {
          title: noteTitle,
          content: noteContent,
          updatedAt: new Date().toISOString(),
        });
      } else {
        addNote({
          title: noteTitle,
          content: noteContent,
        });
      }
      setModalVisible(false);
      setNoteTitle('');
      setNoteContent('');
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={openNewNote}>
          <Text style={styles.addButtonText}>+ New Note</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search notes..."
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Tap "New Note" to create one</Text>
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map(note => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                onPress={() => openEditNote(note)}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteNote(note.id)}
                    style={styles.deleteIconButton}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.noteContent} numberOfLines={3}>
                  {note.content}
                </Text>
                <Text style={styles.noteDate}>
                  {formatDate(note.updatedAt || note.createdAt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Note Editor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={saveNote}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Note title..."
              placeholderTextColor="rgba(255,255,255,0.5)"
            />

            <TextInput
              style={styles.contentInput}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Write your note here..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
    paddingTop: normalize(50),
    paddingBottom: normalize(15),
  },
  headerTitle: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: '#60a5fa',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderRadius: normalize(12),
  },
  addButtonText: {
    color: 'white',
    fontSize: normalize(14),
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: normalize(20),
    marginBottom: normalize(15),
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    fontSize: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    padding: normalize(20),
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(80),
  },
  emptyIcon: {
    fontSize: normalize(64),
    marginBottom: normalize(15),
  },
  emptyText: {
    color: 'white',
    fontSize: normalize(20),
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(14),
  },
  notesList: {
    gap: normalize(12),
  },
  noteCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: normalize(16),
    borderRadius: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(10),
  },
  noteTitle: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '700',
    flex: 1,
  },
  deleteIconButton: {
    padding: normalize(4),
  },
  deleteIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(18),
  },
  noteContent: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    lineHeight: normalize(20),
    marginBottom: normalize(10),
  },
  noteDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: normalize(12),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: normalize(25),
    borderTopRightRadius: normalize(25),
    padding: normalize(20),
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  cancelButton: {
    color: '#ef4444',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  modalTitle: {
    color: 'white',
    fontSize: normalize(18),
    fontWeight: '700',
  },
  saveButton: {
    color: '#60a5fa',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(15),
    borderRadius: normalize(12),
    fontSize: normalize(20),
    fontWeight: '700',
    marginBottom: normalize(15),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contentInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(15),
    borderRadius: normalize(12),
    fontSize: normalize(16),
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});